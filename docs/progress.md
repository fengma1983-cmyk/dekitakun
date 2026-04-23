# できた！くん — 开发进度

> 最后更新：2026-04-23（Phase 1-α slice 完成）
> 对应文档版本：PRD v1.1 / Architecture v1.1 / Plan v1.4

本文档是「高层进度速览」。Phase 切分、未实装 action 清单、CSS 战略决定、
哲学遵守 checklist 等详细信息参见根目录的 [PHASE_STATUS.md](../PHASE_STATUS.md)。

---

## 全体ロードマップ

| Phase | 内容 | 状态 |
|---|---|---|
| **Phase 0** | card session · プロトタイプ · ドキュメント v1.1/v1.4 | ✅ 完了 |
| **Phase 1-α** | 最小可動版（追加・完了・祝福） | ✅ **今 slice で完了** |
| Phase 1-β | 円グラフ（飽和グラフ）· 予実比較 | ⏳ 未着手 |
| Phase 1-γ | タスクタイマー UI（正/倒カウント · 専注モード） | ⏳ 未着手 |
| Phase 1-δ | 誘いカード（3択）· 最小起動 · 気分選択 | ⏳ 未着手 |
| Phase 1-ε | 手描きバッジ取り込み | ⏳ 未着手 |
| **Sprint 1 DoD** | — | Phase 1-δ 完了時点 |
| Phase 2 | 達成感システム · 成長ツリー · paused/postponed UI | ⏳ 未着手 |
| Phase 3 | 宿題 · 振り返り · あしたの種まき · 再開誘い | ⏳ 未着手 |
| Phase 4 | 保護者機能 · シェア · 設定画面 | ⏳ 未着手 |
| Phase 5 | 磨き込み · アニメーション · アイデアボックス | ⏳ 継続 |

---

## ✅ Phase 1-α で実装されたもの

### 設定層（config/）
- [theme.ts](../src/config/theme.ts) — CATEGORY_COLORS（homework のみ飽和 `#51CF66`、他パステル）、PURPLE アクセント、STATUS_COLORS、DIFFICULTY_COLORS、BRAND、TYPOGRAPHY、SPACING、RADIUS
- [defaults.ts](../src/config/defaults.ts) — TIME_CONFIG（15分スロット × 64）、DAY_BANDS 4 本、DURATION_PRESETS、POINTS、INVITATION_LIMITS
- [messages.ts](../src/config/messages.ts) — 7 グループ（CELEBRATION / RETURN / INVITATION / MIN_START / RESUME / DAY_END / TOMORROW_SEED）+ DIFFICULTY_EMOJI / LABEL。冒頭に合言葉「頻度ではなく触れ方で解く」
- [categories.ts](../src/config/categories.ts) — 8 カテゴリ（school/homework/cram/study/play/meal/bath/sleep）
- [invitationRules.ts](../src/config/invitationRules.ts) — 純粋関数群（`decideInvitation` / `isSilentTime` / `isTaskSilenced` / `checkPausedResume` / `checkCurrentTaskInvitation` / `recordShown`）。節制原則 6 条を型レベルで保証

### 状態層（store/・hooks/・utils/）
- [types.ts](../src/store/types.ts) — TaskStatus 6 値、InvitationResponse 8 値（`noReply` が Architecture 仕様の `dismissed` を置換）、MoodLevel、各 interface
- [AppContext.tsx](../src/store/AppContext.tsx) — reducer 実装済 action：HYDRATE / ADD_TASK / UPDATE_TASK / DELETE_TASK / COMPLETE_TASK / START_TIMER / STOP_TIMER / CLEAR_CELEBRATION / ADD_POINTS
- [usePlanner.ts](../src/hooks/usePlanner.ts) — addTask / updateTask / deleteTask / completeTask / clearCelebration
- [storage.ts](../src/utils/storage.ts) — LocalStorage 抽象 + `loadWithMigration<T>` + `buildSeedDayPlan()`（12 タスクの模範 1 日）
- [assert.ts](../src/utils/assert.ts) — 禁止語回避のための `raise()` ヘルパ（詳細は devlog.md 参照）

### UI 層
- [App.tsx](../src/App.tsx) — AppProvider / AppShell / KidHeader（紫グラデ + 日付 + ⭐ポイント）/ TabBar（じかんわり のみ active）/ TodaySummary（分母なし）
- [DayRibbon.tsx](../src/components/planner/DayRibbon.tsx) — 絶対配置リボン + 4 バンド + 空きタップ検出
- [TaskBlock.tsx](../src/components/planner/TaskBlock.tsx) — **アイコン + 難易度絵文字のみ**（2026-04-23 更新: タイトルテキストを撤去、詳細は popover へ集約。詳細は devlog 同日付エントリ）。done 状態は opacity + ✓（line-through 禁止）、aria-label でタスク名・難易度を読み上げる
- [TaskDetailPopover.tsx](../src/components/planner/TaskDetailPopover.tsx) — TaskBlock タップ時に開く詳細表示。`✓ 完了` / `✏️ 編集` / `🗑 消す` + inProgress 時のみ `⏸ 一旦とめる` / `➡ 後にまわす` を grayed-out で表示（Phase 2 予定ラベル付き）
- [NowIndicator.tsx](../src/components/planner/NowIndicator.tsx) — 紫ピン（`#6C63FF`）+ 脈動ドット、60 秒 interval 更新
- [AddTaskModal.tsx](../src/components/planner/AddTaskModal.tsx) — 全項目タップ選択（数字入力なし）、できた！/ほぞん/けす/やめる
- [CelebrationEffect.tsx](../src/components/planner/CelebrationEffect.tsx) — 難易度 3 分岐（StarBurst / ConfettiRain / SoftFlame）、1.8 秒自動 dismiss

### 工程・iPad 対応
- 初回起動 seed（12 タスク：あさごはん 6:30 → ねるじゅんび 22:00）
- iPad 横向き（1194×834）全画面レイアウト
- `vite.config.ts` に `host: "0.0.0.0"` を設定し LAN から iPad 実機アクセス可能

---

## ⏳ 意図的に含めなかったもの（後続 slice）

| 機能 | 担当 Phase | 理由 |
|---|---|---|
| 円グラフ（飽和グラフ） | 1-β | 「動くもの」最速提供を優先 |
| タスクタイマー UI | 1-γ | reducer の `START_TIMER/STOP_TIMER` は定義済、UI 層のみ未実装 |
| 誘いカード（3 択）・最小起動・気分選択 | 1-δ | `invitationRules.ts` 完成済、UI と `useInvitation` hook が未実装 |
| 手描きバッジ | 1-ε | 息子の描画 → 撮影 → PNG 化フローが先 |
| `CARRY_TASK` 自動遷移 | 1-δ 以降 | 誘い層と同時実装 |
| `PAUSE_TASK / POSTPONE_TASK` | 1-δ | 型定義済、呼ぶと `raise` する状態 |
| `SAVE_REVIEW / SAVE_TOMORROW_SEED` | Phase 3 | 同上 |
| challengeBonus · バッジ解放 · streakDays · 成長ツリー | Phase 2 | 現 `ADD_POINTS` は `totalPoints += 1` のみ |

---

## 📋 既知の FIXME · 保留事項

| 項目 | 場所 | 対応 Phase |
|---|---|---|
| `nextFreeSlot` が最後尾追加のみ | [App.tsx:333](../src/App.tsx#L333) | Phase 1-β（空きスロット探索アルゴリズム） |
| CSS 戦略未決定（全インラインスタイル） | 7 ファイル | Phase 1-β キックオフ前日までに決定。候補：CSS Modules / Tailwind / vanilla-extract |
| 初回 reveal 時の息子反応の記録 | fake-a-day レポート | Phase 1-α 動作確認後 |

---

## 🌱 次の作業（再開時はここから）

**Phase 1-β 着手前の必須タスク**：
1. 息子に Phase 1-α を見せる → fake-a-day 第 3 幕通過の記録
2. CSS 戦略決定（詳細は [PHASE_STATUS.md](../PHASE_STATUS.md) の評価軸参照）
3. インラインスタイル一括移行

**Phase 1-β 本体**：
- 円グラフ（飽和グラフ）コンポーネント設計
- 予実比較 UI（`plannedMinutes` vs `actualMinutes`）
- `nextFreeSlot` の空きスロット探索アルゴリズム置換
