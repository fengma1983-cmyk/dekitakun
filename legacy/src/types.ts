// ─── Primitive types ──────────────────────────────────────────────────────────

export type DifficultyLevel = "easy" | "normal" | "challenge";

// "failed" / "missed" は使用禁止。未完了は "carried" で表現する（PRD 3.3）
export type TaskStatus = "planned" | "inProgress" | "done" | "carried";

export type CarryReason =
  | "timeShort"   // 時間が足りなかった
  | "lowEnergy"   // やる気が出なかった
  | "distracted"  // 他のことをしていた
  | "tooHard"     // 難しかった
  | "other";

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;              // UUID
  title: string;
  categoryId: string;      // CATEGORIES の id と紐付け
  subjectId?: string;      // 宿題タスクの場合、Subject の id と紐付け
  startSlot: number;       // 0 = 06:00、1 = 06:15、単位は15分
  durationSlots: number;   // コマ数（1コマ = 15分）
  plannedMinutes: number;  // 予定時間（分）
  actualMinutes?: number;  // 実績時間（完了後に記録）
  difficulty: DifficultyLevel;
  status: TaskStatus;
  isLocked: boolean;       // 保護者がロックした固定タスク
  note?: string;
  createdAt: string;       // ISO 8601
  completedAt?: string;
}

// ─── DayPlan ──────────────────────────────────────────────────────────────────

export interface DayPlan {
  version: number;         // スキーマ変更時にインクリメント
  date: string;            // "YYYY-MM-DD"
  tasks: Task[];
  review?: DailyReview;
  createdAt: string;
  updatedAt: string;
}

// ─── Category / Subject ───────────────────────────────────────────────────────

export interface Category {
  id: string;
  label: string;
  color: string;           // hex（#なし、例："4DABF7"）
  icon: string;
  isDefault: boolean;
  isLocked: boolean;
  subjectIds?: string[];
}

export interface Subject {
  id: string;
  label: string;
  color: string;
  categoryId: string;
}

// ─── Achievement ──────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  unlockedAt?: string;     // ISO 8601。未取得はフィールドなし
}

export interface WeeklyStat {
  weekStart: string;       // "YYYY-MM-DD"（その週の月曜日）
  completedTasks: number;
  totalPoints: number;
  longestFocusMinutes: number;
}

export interface AchievementState {
  version: number;
  totalPoints: number;
  streakDays: number;       // 連続使用日数
  totalActiveDays: number;  // 累計使用日数（連続が切れてもリセットしない）
  records: {
    longestFocusMinutes: number;
    mostTasksInDay: number;
    totalCompletedTasks: number;
    totalChallenges: number;  // "challenge"難易度の完了数
  };
  badges: Badge[];
  weeklyStats: WeeklyStat[];
}

// ─── DailyReview ──────────────────────────────────────────────────────────────

export interface DailyReview {
  selfScore: 1 | 2 | 3 | 4 | 5;
  carryReasons: CarryReason[];
  tomorrowNote: string;
  createdAt: string;
}

// ─── AppSettings ──────────────────────────────────────────────────────────────

export interface AppSettings {
  version: number;
  lockedTaskIds: string[];
  animationsEnabled: boolean;
  fontSizeScale: number;
}

// ─── HomeworkItem ─────────────────────────────────────────────────────────────

export interface HomeworkItem {
  id: string;
  subjectId: string;
  title: string;
  linkedTaskId?: string;
  isDone: boolean;
  createdAt: string;
}

// ─── App State / Actions ──────────────────────────────────────────────────────

export interface AppState {
  currentDate: string;
  dayPlan: DayPlan | null;
  categories: Category[];
  subjects: Subject[];
  achievement: AchievementState;
  settings: AppSettings;
  homeworkItems: HomeworkItem[];
  activeTimerTaskId: string | null;
}

export type AppAction =
  | { type: "ADD_TASK";        payload: Task }
  | { type: "UPDATE_TASK";     payload: { id: string; changes: Partial<Task> } }
  | { type: "CARRY_TASK";      payload: { id: string } }
  | { type: "COMPLETE_TASK";   payload: { id: string; actualMinutes: number } }
  | { type: "START_TIMER";     payload: { taskId: string } }
  | { type: "STOP_TIMER" }
  | { type: "ADD_POINTS";      payload: number }
  | { type: "SAVE_REVIEW";     payload: DailyReview }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "ADD_HOMEWORK";    payload: HomeworkItem }
  | { type: "DONE_HOMEWORK";   payload: { id: string } };
