# Phase Status — できた！くん (じかんわり)

最終更新: 2026-05-23 (セッション終了時)
対応 PRD / Architecture / Plan: v1.2 / v1.2 / v1.5

> **次回セッション開始時の最初の作業**: Plan v1.5 §4 の patch sprint に着手。
> 候補は S3+S4（漢字化 messages.ts + CurrentTaskPanel）または S5（テスト自動化）。
> 具体的な選択は当該セッションで決定。

このドキュメントは「何が終わっていて、何がまだ」を一目で把握するための
進捗スナップショット。Phase の区切り方は Plan v1.5 Section 3.2 に従い、
Phase 1 の内部はさらに α/β/γ/δ/ε に段階化している (息子に最速で
「動くもの」を見せるための slice 戦略)。

---

## 全体ロードマップ

| Phase | 目標 | 状態 |
|---|---|---|
| **Phase 0** | card session · プロトタイプ · ドキュメント v1.1/v1.4 | ✅ 完了 |
| **Phase 1-α** | 最小可動版: 加タスク · 完了 · 祝福 | 🟢 **今ここ (バッチ B 完了、残: リネーム + 漢字化)** |
| Phase 1-β | 円グラフ (飽和グラフ) · 予実比較 | ⏳ 未着手 |
| Phase 1-γ | タスクタイマー UI (正/倒カウント · 専注モード) | ⏳ 未着手 |
| Phase 1-δ | 誘いカード (3択) · 最小起動 · 気分選択 (mood) | ⏳ 未着手 |
| Phase 1-ε | 手描きバッジ取り込み | ⏳ 未着手 |
| **Sprint 1 DoD 達成** | — | Phase 1-δ 完了時点 |
| Phase 2 | 達成感システム · 成長ツリー · paused/postponed UI | ⏳ 未着手 |
| Phase 3 | 宿題 · 振り返り · あしたの種まき · 再開誘い | ⏳ 未着手 |
| Phase 4 | 保護者機能 · シェア · 設定画面 | ⏳ 未着手 |
| Phase 5 | 磨き込み · アニメーション · 専注モード磨き · アイデアボックス | ⏳ 継続 |

---

## Phase 1-α の確定スコープ (本 slice)

### 含まれるもの

**初期実装 (slice キックオフ時点)**

- [x] config/ 全ファイル (categories · theme · defaults · messages 7 グループ · invitationRules)
- [x] store/types.ts (全 interface/type、TaskStatus 6 値、MoodLevel 追加)
- [x] utils/storage.ts (LocalStorage 抽象 · loadWithMigration · seed)
- [x] store/AppContext.tsx (全 action 型定義、reducer は一部実装)
- [x] hooks/usePlanner.ts (CRUD + 完了)
- [x] components/planner/ 5 コンポーネント
  - DayRibbon · TaskBlock · NowIndicator · AddTaskModal · CelebrationEffect
- [x] App.tsx (KidHeader + TabBar + 中央 DayRibbon)
- [x] 初回起動 seed (12 タスクの模範 1 日)
- [x] iPad 横向き対応
- [x] カテゴリ色: homework のみプロトタイプ色 `#51CF66`、他 7 は v1.1 柔色パレット
- [x] ADD_POINTS reducer 暫定実装 (+1 per taskComplete のみ、Phase 2 前倒し)
- [x] FIXME コメント: `nextFreeSlot` 最後尾追加のみ (Phase 1-β で空きスロット探索に置換予定)

**実機テスト反映 (2026-04-23 セッション中追加)**

- [x] **Bug 修正: Points persistence** — useReducer initializer 側で同期ロードに変更。useEffect 内での load → HYDRATE dispatch が初回 mount 時に空 state を LS に上書きしていた競合を解消
- [x] **Bug 修正: 2-slot 難易度絵文字非表示** — `durationSlots <= 2` のタスクでは難易度絵文字を描画しない (幅 35.9px でアイコンと衝突)。情報は popover と aria-label で維持
- [x] **Bug 修正: CelebrationEffect Portal 化** — `createPortal(…, document.body)` + z-index 9999 + `pointerEvents: "none"`
- [x] **TaskDetailPopover 新設** — ribbon の TaskBlock をアイコンのみ表示に変更し、詳細はタップで開く popover へ。popover は完了 / 編集 / 消す + inProgress 時のみ grayed-out の paused/postponed
- [x] **CelebrationEffect 難易度分岐の再設計** — `SoftFlame` 削除 + `TrophyBurst` 新設 (🏆 + 金色 radial glow + 星 + 紙吹雪)。視覚 phase と message phase の時間分離 (1.3s → 2.8s) で文字吹き出しと視覚効果の衝突を根本解決

### [未] 次回以降のタスク

上から優先順。**Phase 1-α 完了前にリネーム + 漢字化を片付ける**。

**Phase 1-α 完了前に片付ける (バッチ B / 用語整理 / 文案方針)**

- [x] **バッチ B: 時刻重複防止** — `src/utils/taskValidation.ts` 新設 + バリデーション組み込み（aa97c46 で完了）
- [x] **バッチ B: 帯ラベル外出し** — `src/components/planner/BandLabels.tsx` 新設、DayRibbon から外出し（aa97c46 で完了）
- [x] **日跨ぎ「じゅんびちゅう」永久ループ修復** — `AppContext.tsx` の seed guard 論理穴を修正（aa97c46 で完了、devlog 2026-04-25 参照）
- [ ] **リネーム: 「やめる」→「閉じる」、「けす」→「消す」** — AddTaskModal と TaskDetailPopover 内。11 歳にとって「やめる」が「タスクやめる / ダイアログやめる」どちらか曖昧。Phase 1-δ の paused「一旦とめる」との混同も先回り解消
- [ ] **決策 B: 漢字+ひらがな混ぜ書き (中学 1 年生レベル、messages.ts 全面)** — [messages.ts](src/config/messages.ts) 全面改訂。UI 文言も同規範で見直し。ただし「できた！」等の感情表現はひらがな継続。禁止ワード規範 (PRD 3.3) は継続遵守

**Phase 1-β 以降 (後続 slice)**

- [ ] **Phase 1-β: 円グラフ (飽和グラフ) + 予実比較 UI + `nextFreeSlot` 置換**
- [ ] **Phase 1-γ: タスクタイマー UI (正/倒カウント、専注モード)** — reducer の `START_TIMER / STOP_TIMER` は実装済、UI 層のみ
- [ ] **Phase 1-δ: 誘いカード (3 択) + 最小起動 + paused/postponed + mood 選択 UI + `CARRY_TASK` 自動遷移** — `invitationRules.ts` と `useInvitation` hook の UI 層実装
- [ ] **Phase 1-ε: 手描きバッジ取り込み** — 息子の紙への描画 → 撮影 → PNG 化フロー

### 意図的に含めなかったもの (次の slice で追加)

| 機能 | 担当 Phase | 理由 |
|---|---|---|
| 円グラフ | 1-β | 「動くもの」最速提供を優先。円グラフは分布を見る機能で、
まずタスク操作の流れを確立してから追加する方が fake-a-day に健全 |
| タスクタイマー UI | 1-γ | reducer の `START_TIMER / STOP_TIMER` は定義済。UI 層のみ未実装 |
| 誘いカード | 1-δ | `invitationRules.ts` は完成。UI 層と useInvitation hook が未実装 |
| 最小起動 (「1 問だけ」) | 1-δ | 誘いカードと同時に実装 |
| 気分 (mood) 選択 UI | 1-δ | `MoodLevel` 型は定義済。誘いカード内で使う |
| 手描きバッジ | 1-ε | 息子の紙への描画 → 撮影 → PNG 化のフローが先 |
| `CARRY_TASK` 自動遷移 | 1-δ 以降 | 誘い層と同時のタイミングで本実装 |
| `PAUSE_TASK / POSTPONE_TASK` reducer 本体 | 1-δ | 型定義済、呼ぶと throw する状態 |
| `ADD_POINTS / SAVE_REVIEW / SAVE_TOMORROW_SEED` | Phase 2/3 | 同上 |

### 未実装の action 一覧 (呼ぶと `throw` する)

`src/store/AppContext.tsx` の reducer 内、および `src/hooks/usePlanner.ts` 内で、
以下は signature と型は揃えてあるが、本体は後続スライスで実装する：

- `CARRY_TASK` (reducer)
- `PAUSE_TASK` (reducer + `usePlanner.pauseTask`)
- `POSTPONE_TASK` (reducer + `usePlanner.postponeTask`)
- `INVITE_RESPONSE` (reducer)
- `SAVE_TOMORROW_SEED` (reducer)
- `SAVE_REVIEW` (reducer)
- `usePlanner.carryTask`

なぜ throw するか: サイレントに何もしない reducer はバグの温床になる。
呼ばれた瞬間に気付ける方が開発サイクルが健全。

### 先行実装した action (Phase 1-α スコープ内に追加)

- `ADD_POINTS` (reducer): `totalPoints` のインクリメントのみ。
  これに伴い `COMPLETE_TASK` の reducer は、完了時に
  `POINTS.taskComplete (=1)` を加算する (冪等性のため二重加算は防止)。
  challengeBonus / バッジ解放 / streakDays / records 更新 / 成長ツリーは
  引き続き Phase 2 スコープ。

  PRD 3.1 との関係: 本来 PRD は「単一指標への依存」を戒め、6 トラック合算の
  totalPoints を設計している。Phase 1-α の `+1 per taskComplete` だけの実装は
  この思想との間に一時的な張力があるが、Phase 2 で他トラック (challenge +3 /
  計画 +2 / 成長 +5 / 自己表現 +1) が足されて自然に解消される想定。

---

## Sprint 1 DoD (Plan 6.4) との差分

Plan 6.4 で定義された Sprint 1 の完了基準に対して、本 slice の位置:

| DoD 項目 | 状態 | 備考 |
|---|---|---|
| タスクの追加・編集・削除が動く | ✅ | AddTaskModal 完備 |
| タスク完了時にアニメーションが出る | ✅ | CelebrationEffect 実装 |
| 誘いカードの 3 択が動く | ⏳ | Phase 1-δ |
| 手描きバッジが少なくとも 1 つアプリに入っている | ⏳ | Phase 1-ε |
| fake-a-day 第 3 幕 + 第 6 幕を通過 | ⏳ | 1-β/γ/δ が揃ってから実施 |
| 息子が「使いたい」と言う | ⏳ | Phase 1-δ 完了時点で最初の提示を想定 |

**Sprint 1 の正式達成は Phase 1-δ 完了時点。**

---

## CSS 戦略決定 (Phase 1-β 開始前に確定)

### 現状

Phase 1-α では **全コンポーネントがインラインスタイル** (React の `style={{}}`
オブジェクト) で書かれている。速度重視の判断だが、視覚密度が上がると
メンテ性が落ちるため Phase 1-β の円グラフ実装開始**前日まで**に
CSS 戦略を決定し、一括移行する。

### 決定までのデッドライン

Phase 1-β 実装開始の前日 (Phase 1-β キックオフの時期が決まり次第更新)。

### 移行候補と評価軸

| 候補 | 特徴 |
|---|---|
| **CSS Modules** | 依存追加なし。Vite 標準サポート。クラス名のスコープ分離のみ。 |
| **Tailwind** | ユーティリティファースト。学習コスト中。テーマトークンとの連携は plugin で。 |
| **vanilla-extract** | TypeScript 型安全な CSS。theme.ts との統合が最も自然。ビルド構成追加あり。 |

**評価軸 (決定時に使う)**:
1. Architecture v1.1 の design system (theme.ts / messages.ts) との統合容易性
2. 息子がアイデアボックスで色 / レイアウト案を提出した時の修正容易性
   (例: 「このボタン、もうちょっと丸く」→ 1 ファイル編集で済むか)
3. ハードコード禁止ルール (Architecture 8.4) を型レベルで強制できるか

### 一括移行対象 (現行インラインスタイル箇所)

Phase 1-β キックオフ時に以下を戦略に沿って移行する：

- `src/App.tsx` (AppShell / KidHeader / TabBar / TodaySummary / SummaryChip)
- `src/components/planner/DayRibbon.tsx`
- `src/components/planner/TaskBlock.tsx`
- `src/components/planner/NowIndicator.tsx`
- `src/components/planner/AddTaskModal.tsx` (ChipButton / Field / input/selectStyle / primaryButtonStyle を含む)
- `src/components/planner/TaskDetailPopover.tsx` (2026-04-23 新設)
- `src/components/planner/CelebrationEffect.tsx` (StarBurst / ConfettiRain)
- `src/components/planner/TrophyBurst.tsx` (2026-04-23 新設)
- `src/index.css` (@keyframes のみ残す方針。色・spacing は戦略により theme.ts 経由に寄せる)

### 追加ルール (戦略決定までの期間)

- 新コンポーネント (例: Phase 1-δ の DayEndScreen / InvitationCard) は
  **同じインラインスタイル方式で書き足してよい**
- ただし一括移行対象として、このリストに随時追記する
- ハードコードカラーを新規に書き加えることは禁止 (既存ルール継続)

---

## 哲学遵守チェック (本 slice の自己点検対象)

v1.1 で新しく追加された「同行者」哲学と禁止ワード規範を、本 slice で
破っていないかを自己点検する。詳細は実装完了後の grep + 目視レビューで。

- [x] 禁止ワード (failed/missed/incomplete/error/delayed/遅れ/遅延/必ず/
      しなければ/まだ〜していない/未完了/失敗) が src/ に含まれないこと
- [x] 「3/10」「完了率」「達成率」等の分母表示を使っていない
- [x] ★★★ を使わず難易度を 😊😐😅 で表示
- [x] 「いま」ピンは紫 (#6C63FF)、赤禁止
- [x] 完了タスクに line-through を使わず opacity + チェックマークで表現
- [x] messages.ts 冒頭に「頻度ではなく触れ方で解く」の合言葉
- [x] invitationRules.ts の節制原則 6 条が純粋関数で技術的に保証されている

---

## ドキュメント改訂

### 現状（2026-05-23）

PRD / Architecture / Plan は **v1.2 / v1.2 / v1.5** で凍結中（badcda7 で commit 済）。
旧版 v1.1.1 / v1.1 / v1.4 は `docs/archive/` に退避。

### 改訂の経緯

当初想定:「Phase 1-ε 完了時に v1.2 へまとめて反映」（PHASE_STATUS.md 2026-04-23 時点）

実際: Phase 1-α patch sprint 中（漢字化 + emoji-only + CurrentTaskPanel への
哲学的修訂）で必要になり、Phase 1-ε 完了を待たず提前改訂（2026-05-23）。
理由: 哲学的修訂を PRD/Arch/Plan に反映しないと、後続 sprint の参照が不能になるため。

### 運用ルール（5/23 確定）

- 各 slice 終了時の進捗更新は **本ファイル (PHASE_STATUS.md)** と
  [docs/devlog.md](docs/devlog.md) のみ
- `docs/*.docx`（PRD / Architecture / Plan）の改訂は、
  **哲学的修訂が発生した時にのみ** 実施する（軽微な実装調整では改訂しない）
- 次回 docx 改訂の想定 trigger:
  - 哲学的修訂が発生した時
  - Phase 1 全体完了時の総括

### 過去の反映実績

**v1.1.1/v1.1/v1.4 → v1.2/v1.2/v1.5（badcda7、2026-05-23）の反映項目**:

- PRD 2.3 / 7.3: TaskBlock 表示規則、CelebrationEffect
- PRD 3.3 / 文案: 禁止ワード拡張、漢字+ひらがな混ぜ書き、「ひらがな化は降格」原則
- Architecture 2.2 / 新章 / 3.2 / 4.1 / 7.3: 占位純関数、時刻重複防止、帯ラベル外置、漢字化指針、ACHIEVEMENT 永続化、Portal/phase 状態機
- Plan 6.2-6.3 / 7.1: Sprint story α/β/γ/δ/ε 分割、簡易 fake-a-day 追加
