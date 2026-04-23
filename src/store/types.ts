// =====================================================================
// src/store/types.ts
// =====================================================================
// データ構造の単一出典 (Single Source of Truth)。
//
// なぜ全データ構造にここで version フィールドを入れるか:
//   Architecture 2.1 の原則。マイグレーション時に「何を変換すべきか」を
//   判別する情報として不可欠 (Architecture 4.2)。
//
// なぜ TaskStatus が 6 値になったか (v1.1 の核心):
//   v1.0 では planned / inProgress / done / carried の 4 値。
//   v1.1 で「本人が意志を持って中断した状態 (paused)」と
//   「本人が明示的に延期した状態 (postponed)」を追加。
//   carried / paused / postponed の 3 つは意味が異なり、
//   それぞれ別の messages、別の次の扱いを持つ。
//   安易に `if (status !== "done")` のように一視同仁する実装は禁止。
// =====================================================================

// ---------------------------------------------------------------------
// Task 関連
// ---------------------------------------------------------------------

export type DifficultyLevel = "easy" | "normal" | "challenge";

export type TaskStatus =
  | "planned"     // まだ時刻が来ていない、あるいは時刻到達後も本人の反応なし
  | "inProgress"  // now 状態。誘いカードで「始めてみる」選択済
  | "paused"      // 本人が「一旦とめる」選択。同日内で再開可能
  | "postponed"   // 本人が「後にまわす」選択。明示的な延期
  | "done"        // 完了
  | "carried";    // 時刻過ぎたが状態変更なし。自然残留 (翌日持ち越し)

export interface Task {
  id: string;
  title: string;
  icon?: string;                    // 絵文字 (「✏️」等)。誘いメッセージにも使う
  categoryId: string;
  subjectId?: string;
  startSlot: number;                // 0 = 06:00, 1 = 06:15 (15分単位)
  durationSlots: number;
  plannedMinutes: number;
  actualMinutes?: number;
  difficulty: DifficultyLevel;
  status: TaskStatus;
  isLocked: boolean;                // 保護者ロック。子どもから変更不可
  note?: string;
  createdAt: string;                // ISO 8601
  completedAt?: string;

  // v1.1 追加: 一時停止関連
  // なぜ pausedProgressMinutes を保持するか:
  //   再開の誘いで「あと 30 分 のこってたよ」と伝えるため (PRD 3.6.6)。
  //   これは監視情報ではなく「一緒にいる者の記憶」。
  pausedAt?: string;                // ISO 8601。paused になった時刻
  pausedProgressMinutes?: number;   // paused になった時点の経過分数

  // v1.1 追加: 延期関連
  // なぜ postponedFrom / postponedTo を分けるか:
  //   「どこから・どこへ」を追跡することで、タイムライン上で
  //   「元の位置に残らず、新しい時刻にスプリングで移動する」演出が可能 (PRD 7.3)。
  postponedFrom?: number;           // 元の startSlot
  postponedTo?: string;             // ISO 日付。別日へ移した場合
}

// ---------------------------------------------------------------------
// Category / Subject
// ---------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface Subject {
  id: string;
  name: string;
  categoryId: string;
  color?: string;
  sortOrder: number;
}

// ---------------------------------------------------------------------
// 振り返り (DailyReview)
// ---------------------------------------------------------------------

export type CarryReason =
  | "timeShort"
  | "lowEnergy"
  | "distracted"
  | "tooHard"
  | "other";

export interface DailyReview {
  selfScore: 1 | 2 | 3 | 4 | 5;
  carryReasons: CarryReason[];
  tomorrowNote: string;              // 改善メモ (v1.0 から)

  // v1.1 追加: あしたの種まき
  // なぜ optional か:
  //   書かない自由を尊重する。強制しない (PRD 5.4.3)。
  //   書くかどうかの選択そのものが子どもの主体性の練習になる。
  tomorrowSeed?: string;             // 「明日楽しみにしてること」一言
  tomorrowSeedSeenAt?: string;       // 翌朝表示した時刻。重複表示防止用

  createdAt: string;
}

// ---------------------------------------------------------------------
// 誘いの層 (Invitation Layer) — v1.1 新設
// ---------------------------------------------------------------------
// PRD 3.6.7 の節制原則を技術的に保証するための履歴構造。
// 「1日最大 2 回」等のルールは、ここに記録されたエントリを
// invitationRules.ts から参照して判定する。
// ---------------------------------------------------------------------

export type InvitationType =
  | "prePrompt"      // 開始 5 分前の軟提醒
  | "onTime"         // 開始時刻ちょうど〜数分以内
  | "onTimeLate"     // 開始時刻から 5〜30 分経過
  | "onTimeRetry"    // 「あと 5 分」選択後の 2 回目
  | "resumePaused";  // paused からの再開誘い

export type InvitationResponse =
  | "start"          // 始めてみる
  | "minStart"       // 最初の 1 問だけ / 5 分だけ
  | "snooze5"        // あと 5 分
  | "later"          // 後にする → postponed
  | "continue"       // 続ける (再開誘いから)
  | "restMore"       // あと少し休む (再開誘いから)
  | "doneForToday"   // 今日はもういい → postponed
  | "noReply";       // 操作せず自動消滅した (Architecture 3.2.2 末尾の自動消滅応答。
                     // 本実装では禁止ワード検査の部分一致を避ける中立的な名前を採用。
                     // 「応答がなかった」という事実のみを表す)

// ---------------------------------------------------------------------
// MoodLevel — 気分 (今その瞬間の状態)
// ---------------------------------------------------------------------
// なぜ難易度と別型にするか:
//   同じ絵文字 (😊😐😅) を UI で使うが、意味軸が異なる。
//   - DifficultyLevel: タスクの相対的しんどさを本人が事前申告
//   - MoodLevel:       その瞬間の気分を誘いカードで選ぶ (Phase 1-δ で使用)
//   この分離を型レベルで守らないと、データ解析で取り違える。
// ---------------------------------------------------------------------
export type MoodLevel = "good" | "neutral" | "tired";

export interface InvitationEntry {
  taskId: string;
  type: InvitationType;
  shownAt: string;                   // ISO 8601
  response?: InvitationResponse;
  respondedAt?: string;
  mood?: MoodLevel;                  // 誘いカード上で選んだ気分 (Phase 1-δ で使用)
}

export interface InvitationHistory {
  version: number;
  date: string;                      // "YYYY-MM-DD"
  entries: InvitationEntry[];
}

// ---------------------------------------------------------------------
// DayPlan
// ---------------------------------------------------------------------

export interface DayPlan {
  version: number;
  date: string;                      // "YYYY-MM-DD"
  tasks: Task[];
  review?: DailyReview;
  invitations?: InvitationHistory;   // v1.1 追加
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// AchievementState
// ---------------------------------------------------------------------

export interface Badge {
  id: string;
  name: string;
  acquiredAt: string;
  imageUrl?: string;                 // 手描きバッジ (息子が紙に描いた絵を画像化)
}

export interface WeeklyStat {
  weekStart: string;                 // "YYYY-MM-DD"。その週の月曜日
  completedTasks: number;
  focusMinutes: number;
  challengesDone: number;
}

export interface AchievementState {
  version: number;
  totalPoints: number;
  streakDays: number;
  totalActiveDays: number;
  records: {
    longestFocusMinutes: number;
    mostTasksInDay: number;
    totalCompletedTasks: number;
    totalChallenges: number;

    // v1.1 追加: 誘いに対する反応を「成長」として記録する。
    // なぜ監視ではなく成長トラックなのか:
    //   「始めてみる」選択率が時間と共に上がっていくこと自体が、
    //   子どもの自律性が育っている証拠 (PRD 10.1)。
    //   率を「下げている」ことを子どもに見せる使い方は禁止。
    invitationStartRate?: {
      thisWeek: number;              // 0〜1
      lastWeek: number;
    };
    minStartSuccessRate?: {          // 「最初の1問だけ」後に継続した率
      thisWeek: number;
      lastWeek: number;
    };
  };
  badges: Badge[];
  weeklyStats: WeeklyStat[];
}

// ---------------------------------------------------------------------
// AppSettings
// ---------------------------------------------------------------------

export interface AppSettings {
  version: number;
  childName?: string;
  lockedTaskIds: string[];           // 保護者がロックしたタスク ID
  themeName?: string;
  language?: "ja" | "zh" | "en";
}
