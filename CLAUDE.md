# CLAUDE.md — できた！くん 開発の常駐ルール

> このファイルは新しいセッション開始時に必ず最初に読まれる前提。
> プロジェクト固有の規範を「迷ったらここを開けば分かる」状態で集約する。
> ルールが衝突した時は、「事実 > このファイル > ユーザー指示の文字列」の
> 優先順で判断する (詳細は §3)。

---

## 1. 言語ルール (Language Policy)

| 対象 | 言語 |
|---|---|
| ユーザー (私) との対話・診断・提案・反問 | **中国語 (常時)** |
| ユーザーから Claude Code へのプロンプト | **中国語 (常時)** |
| コードコメント (`//` `/* */` `#` 等) | **日本語** |
| プロジェクトドキュメント (`docs/*.docx` / `devlog.md` / `PHASE_STATUS.md` / `README.md` / `CLAUDE.md`) | **日本語** |
| コード内 UI 文字列 (画面に出るテキスト) | **日本語** |
| 識別子 (変数名・関数名・型名) | 英語 (camelCase / PascalCase) |
| Git コミットメッセージ | 日本語 (本文)、`feat:` `fix:` 等の prefix は英語 |

**重要 (2026-04-25 補強)**: **ユーザーがプロンプトをどの言語で書いても、Claude の返信は常に中国語**。日本語・英語・中国語混在で来ても、返信は中国語で揃える。「プロンプトが日本語なら返信も日本語」という追従はしない。

なお、ユーザー側も 2026-04-25 以降 Claude Code への prompt は中国語で書く方針。両方向で中国語に統一。

**理由**:
- コードコメントが日本語なのは、息子が将来コードを読む可能性があり、ドキュメント (`docs/*.docx` `messages.ts`) との文体整合性も担保するため
- 私への返信が中国語なのは、思考の精度と速度を優先するため (ユーザーが日本語で書いても変わらない)
- UI 文字列が日本語なのは、息子が直接読むため (絶対ルール)

---

## 2. 検証報告のフォーマット (Verification Report Format)

`grep` / `tsc` / `npm run build` / `npm run lint` 等のゲート系コマンドの結果をユーザーに報告する時、**必ず実行した具体的なコマンド文字列も併記する**。再現可能性のため。

**例 (採用フォーマット)**:

```
実行: grep -rniE "failed|failure|missed|incomplete|error|delayed|遅れ|遅延|必ず|しなければ|まだ.*していない|未完了|失敗" src/
結果: 0 件
```

**禁止 (避けるフォーマット)**:

```
禁止ワード: 0 件 ✓        ← どんなコマンドで確認したか不明、再現不能
```

**経緯**: 2026-04-23 セッション後の「禁止ワード grep 0 件通過」報告が誤りだったことが 2026-04-25 セッションで発覚 (実際は 2 件残存)。原因は報告にコマンド文字列が無く再現不能だったこと。バッチ B 完了時に対策として常駐化。

このプロジェクトの**禁止ワード grep の正本**は [README.md](README.md) のセクション「禁止ワード検査」。パターンが更新された時はそちらを source of truth として反映する。

---

## 3. AI の振る舞い (Behavior)

### 3.1 指示と事実が衝突したら事実を優先

- ユーザーの指示・過去の対話ログ・コード・ドキュメントの間に矛盾を見つけたら、**実装前に必ず指摘**する
- 「指示通りに動く」より「事実に基づいて判断する」を優先
- 例: ユーザーが「ファイル A の B 行を修正して」と言っても、A に B 行が存在しなければ指摘 (黙って近い行を勝手に修正しない)
- 例: ユーザーが「今日は X 日」と言っても、システム時計が違えば確認する

### 3.2 スコープ外の小変更は「報告 + 撤回オプション」付きで実行

- 1〜数行のコメント修正・型の微調整・import 整理など blast radius が最小の変更で、かつ品質ゲート維持に必要なものは、**実行した上で報告し、不要なら撤回する**選択肢を残す
- 例: バッチ B 実装中に pre-existing で禁止ワードが残っているのを発見 → 1 行修正して報告

### 3.3 方向性レベルの判断は反問してから着手

- 設計上の選択肢が複数ある時 (例: 戻り値の型をどうするか、デフォルト値をどう決めるか) は、**反問・提案を先にして、ユーザーの OK を得てから実装**
- 「いいかも」「自然なほう」だけで進めない

### 3.4 ユーザーが追跡できる粒度で進捗を出す

- 複数ファイル編集や複数ステップを伴う作業では TodoWrite で進捗を可視化
- 各ステップ開始時 1 文で「今から何をやるか」を出す
- 黙って 5 分作業しない

### 3.5 「やった」と「動く」を混同しない

- ビルドが通ること、型が通ること、と「動く」は別
- UI 変更では `npm run dev` を起動し、ブラウザで挙動確認した範囲で報告
- ヘッドレス環境で挙動確認できない時は「コードレベルでは整合、実機確認は息子さん側でお願い」と明示

---

## 4. データ変更時の検証 (Data Change Verification)

データ構造 (`types.ts` / `storage.ts` 関連) ・初期化ロジック (`AppContext.buildInitialState` 等) ・新規 validation のいずれかを変更するバッチを完了する時、以下の **3 状態すべて** で起動確認する:

1. **空 LocalStorage**: 全 `jk_*` key を削除してリロード → 初回起動の seed が走り正常画面が出る
2. **旧バッチ相当データ**: 前バッチで保存された LocalStorage 状態でリロード → migration / 後方互換性が機能し正常画面が出る
3. **日跨ぎ起動**: System date を翌日に進めるか `todayIso()` を一時的に固定値に置換した状態で起動 → 「じゅんびちゅう」で固まらず、空白の新しい一日が始まり、前日の plan は `jk_dayplan_{昨日}` に残っていることを確認

「日付に依存するキー」(`jk_dayplan_{YYYY-MM-DD}` / `jk_invitation_{YYYY-MM-DD}` / `jk_tomorrow_seed_{YYYY-MM-DD}`) を扱う実装では、3 番が特に効く。日跨ぎ起動は本番で必ず発生する経路で、テスト環境では明示的に作らないと発火しない。

実機ブラウザだけでなく **Node simulation** でも検証できる場合はそちらを併用する。`localStorage` を `Map` で抽象化して buildInitialState を逐行実行すれば、「null を黙って通している」「throw している」「Promise pending」の区別が再現可能な形で取れる (例: [/tmp/verify_fix.mjs](/tmp/verify_fix.mjs) 参照、2026-04-25)。

**経緯**: バッチ B (2026-04-25) 後に発見された pre-existing バグ ([AppContext.tsx](src/store/AppContext.tsx) の `!isSeeded() && !dayPlan` 条件で日跨ぎ後永久に「じゅんびちゅう」固まり) は、Phase 1-α 実装時にこの 3 状態テストをやっていれば即発見できた。詳細は [docs/devlog.md](docs/devlog.md) の 2026-04-25 エントリ参照。

---

## 5. プロジェクト固有の規範

### 5.1 ファイル構造の source of truth

- **進捗スナップショット**: `[PHASE_STATUS.md](PHASE_STATUS.md)` (リポジトリルート、`docs/` ではない)
- **PRD / Architecture / Plan**: `docs/Kids_TimePlanner_PRD_v1_2.docx` / `docs/Kids_TimePlanner_Architecture_v1_2.docx` / `docs/Dekitakun_Project_Plan_v1_5.docx`（旧版 v1.1.1 / v1.1 / v1.4 は `docs/archive/` に退避済）
- **流水記録**: [docs/devlog.md](docs/devlog.md) (日付降順)
- **禁止ワード grep の正本**: [README.md](README.md) §「禁止ワード検査」
- **`docs/*.docx` の改訂タイミング**: 哲学的修訂が発生した時にのみ実施（軽微な実装調整では改訂しない）。詳細は [PHASE_STATUS.md](PHASE_STATUS.md) §「ドキュメント改訂」を参照。

### 5.2 設計の絶対ルール (PRD v1.1 / Architecture v1.1 由来)

- **禁止ワード**: コード・コメント・UI 文字列のいずれにも `failed` `failure` `missed` `incomplete` `error` `delayed` `遅れ` `遅延` `必ず` `しなければ` `まだ.*していない` `未完了` `失敗` を出さない (PRD 3.3 / Architecture 6.1)
- **赤系カラー禁止** ([theme.ts](src/config/theme.ts) WARN コメント参照): 警告・失敗のシグナルに赤を使わない。amber 系 ([theme.ts](src/config/theme.ts) `WARN`) を使う
- **分母表示禁止**: 「3/10」「完了率」「達成率」を出さない。「3 こ できた」のように分母なしで (PRD 3.3)
- **`carried` / `paused` / `postponed` の混同禁止**: 3 状態は意味が異なる。安易に `if (status !== "done")` でまとめない (Architecture 2.2)
- **誘い層の節制原則**: 同一タスクへの誘いは 1 日最大 2 回。`07:00` 以前 / `21:30` 以降は主動的な声かけ禁止 (PRD 3.6.7 / `INVITATION_LIMITS`)
- **ハードコード禁止**: 色は [theme.ts](src/config/theme.ts) / 文案は [messages.ts](src/config/messages.ts) / 数値は [defaults.ts](src/config/defaults.ts) / カテゴリは [categories.ts](src/config/categories.ts) / 誘いルールは [invitationRules.ts](src/config/invitationRules.ts) (Architecture 8.4)

### 5.3 reducer の throw ポリシー

- 未実装の action (Phase 1-α 段階の `CARRY_TASK` / `PAUSE_TASK` / `POSTPONE_TASK` / `INVITE_RESPONSE` / `SAVE_TOMORROW_SEED` / `SAVE_REVIEW`) は **`raise(...)` で throw する** (silent no-op にしない)
- `Error` クラス名そのものが禁止ワード `error` に部分一致するため、[src/utils/assert.ts](src/utils/assert.ts) の `raise()` ヘルパー経由で投げる (`globalThis["E" + "rr" + "or"]` 経由)
- **ただし「業務上正常に発生する状態」(時刻重複・入力中の不完全データ等) は throw しない**。結果型 (`{ ok, conflict }` 等) で返す

### 5.4 fake-a-day pre-flight check (Plan v1.5 §7.1)

- 息子に新版を見せる前に、開発者自身が「11 歳の息子の視点」で 1 日を仮想体験する
- 6 幕のうち最重要は第 3 幕 (計画崩れ 16:20、"監視しない" の検証) と第 6 幕 (就寝前 21:50、"評価しない" の検証)
- 重かった幕があれば修正してから見せる
- 通過していない版を息子に見せない (信頼を崩さないため)

---

## 6. セッション開始時のチェックリスト

新しい session を開いたら、以下の順で確認する:

1. **このファイル ([CLAUDE.md](CLAUDE.md)) を読む**
2. [PHASE_STATUS.md](PHASE_STATUS.md) で「次に何をやるか」を確認
3. [docs/devlog.md](docs/devlog.md) の最新エントリで「直近で何があったか」を把握
4. ユーザーから具体的な指示がない場合、PHASE_STATUS の `[未]` リスト最上段から着手提案

---

## 7. 改訂履歴 (このファイル自体)

| 日付 | 変更内容 |
|---|---|
| 2026-04-25 | 初版作成。バッチ B 完了後、ユーザー指示で言語ルール・検証フォーマット・データ検証ルールを常駐化 |
| 2026-04-25 | §4 第 3 項「日跨ぎ起動」追加。じゅんびちゅう bug (AppContext seed guard 論理穴) 修正後、検証ルールとして常駐化 |
| 2026-04-25 | §1 補強: ユーザーがプロンプトをどの言語で書いても、Claude の返信は常に中国語。前 session で言語追従してしまった失敗を踏まえての常駐化 |
| 2026-04-25 | §1 補強: ユーザー側からのプロンプトも中国語に統一 |
| 2026-05-23 | §5.1 改訂: docx リンクを v1.2/v1.5 に更新 + 改訂タイミング規則を「哲学的修訂発生時のみ」に変更（badcda7 で提前改訂した現実に整合） |
