// =====================================================================
// src/utils/storage.ts
// =====================================================================
// LocalStorage 読み書きの単一出典。
//
// なぜ全ての I/O をここに集約するか (Architecture 2.1 / 4.1):
//   - キーの typo や重複を防ぐ (STORAGE_KEYS 定数)
//   - version 管理とマイグレーションを一箇所で処理
//   - テストで mock するときに差し替える対象が明確
//   - 将来 IndexedDB / Supabase に移行するときの交換点になる
// =====================================================================

import type {
  DayPlan,
  Task,
  AchievementState,
  AppSettings,
  InvitationHistory,
  Category,
  Subject,
} from "../store/types";
import { DEFAULT_CATEGORIES, DEFAULT_SUBJECTS } from "../config/categories";

// ---------------------------------------------------------------------
// スキーマバージョン
// v1.0: 1  (初版)
// v1.1: 2  (Task に paused/postponed、DayPlan に invitations、etc.)
// ---------------------------------------------------------------------
export const CURRENT_SCHEMA_VERSION = 2;

// ---------------------------------------------------------------------
// キー定数
// 日付を含むキーは動的に組み立てる (DAY_PLAN / INVITATION_HISTORY 等)
// ---------------------------------------------------------------------
export const STORAGE_KEYS = {
  SCHEMA_VERSION:     "jk_schema_version",
  CATEGORIES:         "jk_categories",
  SUBJECTS:           "jk_subjects",
  ACHIEVEMENT:        "jk_achievement",
  SETTINGS:           "jk_settings",
  SEEDED:             "jk_seeded",               // 初回 seed 済フラグ
  DAY_PLAN_PREFIX:    "jk_dayplan_",             // + "YYYY-MM-DD"
  INVITATION_PREFIX:  "jk_invitation_",          // + "YYYY-MM-DD"
  TOMORROW_SEED_PREFIX: "jk_tomorrow_seed_",     // + "YYYY-MM-DD"
} as const;

export const dayPlanKey  = (date: string) => `${STORAGE_KEYS.DAY_PLAN_PREFIX}${date}`;
export const invitationKey = (date: string) => `${STORAGE_KEYS.INVITATION_PREFIX}${date}`;
export const tomorrowSeedKey = (date: string) => `${STORAGE_KEYS.TOMORROW_SEED_PREFIX}${date}`;

// =====================================================================
// 低レベル: 安全な JSON I/O
// =====================================================================

function safeParse<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 破損データに遭遇した場合は null を返す (アプリは既定値で起動できるべき)
    return null;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// =====================================================================
// マイグレーション (Architecture 4.2)
// =====================================================================

function migrateV1toV2<T extends { version?: number }>(data: T): T {
  // v1.1 で Task に pausedAt / postponedFrom 等の optional フィールドを追加。
  // 既存 Task の status は変更しない (本人のアクションがない状態を
  // 勝手に paused / postponed にしない。carried のままにする)。
  return { ...data } as T;
}

export function loadWithMigration<T extends { version?: number }>(
  key: string,
): T | null {
  const raw = safeParse<T>(localStorage.getItem(key));
  if (raw === null) return null;

  const version = raw.version ?? 0;
  if (version === CURRENT_SCHEMA_VERSION) return raw;

  let migrated: T = raw;
  if (version < 2) migrated = migrateV1toV2(migrated);

  (migrated as { version: number }).version = CURRENT_SCHEMA_VERSION;
  write(key, migrated);
  return migrated;
}

// =====================================================================
// 高レベル API
// =====================================================================

export function loadDayPlan(date: string): DayPlan | null {
  return loadWithMigration<DayPlan>(dayPlanKey(date));
}

export function saveDayPlan(date: string, plan: DayPlan): void {
  const next: DayPlan = {
    ...plan,
    version: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  write(dayPlanKey(date), next);
}

export function loadInvitationHistory(date: string): InvitationHistory {
  const existing = loadWithMigration<InvitationHistory>(invitationKey(date));
  return (
    existing ?? {
      version: CURRENT_SCHEMA_VERSION,
      date,
      entries: [],
    }
  );
}

export function saveInvitationHistory(date: string, history: InvitationHistory): void {
  write(invitationKey(date), {
    ...history,
    version: CURRENT_SCHEMA_VERSION,
  });
}

export function loadCategories(): Category[] {
  const raw = safeParse<Category[]>(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
  return raw ?? DEFAULT_CATEGORIES;
}

export function saveCategories(cats: Category[]): void {
  write(STORAGE_KEYS.CATEGORIES, cats);
}

export function loadSubjects(): Subject[] {
  const raw = safeParse<Subject[]>(localStorage.getItem(STORAGE_KEYS.SUBJECTS));
  return raw ?? DEFAULT_SUBJECTS;
}

export function saveSubjects(subs: Subject[]): void {
  write(STORAGE_KEYS.SUBJECTS, subs);
}

export function loadAchievement(): AchievementState {
  const existing = loadWithMigration<AchievementState>(STORAGE_KEYS.ACHIEVEMENT);
  return existing ?? createEmptyAchievement();
}

export function saveAchievement(state: AchievementState): void {
  write(STORAGE_KEYS.ACHIEVEMENT, {
    ...state,
    version: CURRENT_SCHEMA_VERSION,
  });
}

export function loadSettings(): AppSettings {
  const existing = loadWithMigration<AppSettings>(STORAGE_KEYS.SETTINGS);
  return existing ?? createEmptySettings();
}

export function saveSettings(settings: AppSettings): void {
  write(STORAGE_KEYS.SETTINGS, {
    ...settings,
    version: CURRENT_SCHEMA_VERSION,
  });
}

// =====================================================================
// 初期値ファクトリ
// =====================================================================

export function createEmptyAchievement(): AchievementState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    totalPoints: 0,
    streakDays: 0,
    totalActiveDays: 0,
    records: {
      longestFocusMinutes: 0,
      mostTasksInDay: 0,
      totalCompletedTasks: 0,
      totalChallenges: 0,
    },
    badges: [],
    weeklyStats: [],
  };
}

export function createEmptySettings(): AppSettings {
  return {
    version: CURRENT_SCHEMA_VERSION,
    lockedTaskIds: [],
    language: "ja",
  };
}

export function createEmptyDayPlan(date: string): DayPlan {
  const now = new Date().toISOString();
  return {
    version: CURRENT_SCHEMA_VERSION,
    date,
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

// =====================================================================
// 初回 seed
// =====================================================================
// なぜ seed を入れるか:
//   起動時に「からっぽのタイムライン」を見せると、11 歳には何をすれば
//   いいか分からない。代表的な 1 日 (平日想定) を埋めておくことで、
//   「これは自分の 1 日を表すもの」と直感的に理解できる (Claude Design 議論)。
//
// なぜ「学校」を isLocked にするか:
//   保護者ロック機能 (PRD 6) の最小デモ。学校は動かせないことを示す。
// =====================================================================

export function isSeeded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SEEDED) === "1";
}

export function markSeeded(): void {
  localStorage.setItem(STORAGE_KEYS.SEEDED, "1");
}

function seedTask(
  id: string,
  title: string,
  icon: string,
  categoryId: string,
  startSlot: number,
  durationSlots: number,
  opts: Partial<Pick<Task, "difficulty" | "isLocked" | "subjectId">> = {},
): Task {
  return {
    id,
    title,
    icon,
    categoryId,
    subjectId: opts.subjectId,
    startSlot,
    durationSlots,
    plannedMinutes: durationSlots * 15,
    difficulty: opts.difficulty ?? "normal",
    status: "planned",
    isLocked: opts.isLocked ?? false,
    createdAt: new Date().toISOString(),
  };
}

export function buildSeedDayPlan(date: string): DayPlan {
  // slot 0 = 06:00, slot 1 = 06:15, ...
  // 一日のお手本 (平日想定 / 学校は 08:00–14:30)
  const tasks: Task[] = [
    seedTask("seed-1",  "あさごはん",      "🍚", "meal",     2,  2),                                                    // 06:30–07:00
    seedTask("seed-2",  "とうこうじゅんび","🎒", "morning",  4,  4),                                                    // 07:00–08:00   * category morning は未定義、後述で置き換え
    seedTask("seed-3",  "がっこう",        "🏫", "school",   8,  26, { isLocked: true }),                               // 08:00–14:30
    seedTask("seed-4",  "おやつ",          "🍪", "meal",     34, 2),                                                    // 14:30–15:00
    seedTask("seed-5",  "さんすうの宿題",  "✏️", "homework", 36, 3,  { difficulty: "challenge", subjectId: "sansuu" }), // 15:00–15:45
    seedTask("seed-6",  "こくごの宿題",    "✏️", "homework", 39, 2,  { difficulty: "normal",    subjectId: "kokugo" }), // 15:45–16:15
    seedTask("seed-7",  "あそび",          "🎮", "play",     42, 4),                                                    // 16:30–17:30
    seedTask("seed-8",  "じしゅう",        "📖", "study",    46, 3,  { difficulty: "normal" }),                         // 17:30–18:15
    seedTask("seed-9",  "ゆうごはん",      "🍚", "meal",     52, 3),                                                    // 19:00–19:45
    seedTask("seed-10", "おふろ",          "🛁", "bath",     55, 2),                                                    // 19:45–20:15
    seedTask("seed-11", "よみもの",        "📖", "study",    57, 3,  { difficulty: "easy" }),                           // 20:15–21:00
    seedTask("seed-12", "ねるじゅんび",    "😴", "sleep",    60, 4),                                                    // 21:00–22:00
  ];

  // category "morning" は DEFAULT_CATEGORIES に存在しないので school に寄せる
  // (「とうこうじゅんび」を「あさ」帯のものとして視覚的に扱う)
  const normalized = tasks.map((t) =>
    t.categoryId === "morning" ? { ...t, categoryId: "school" } : t,
  );

  const now = new Date().toISOString();
  return {
    version: CURRENT_SCHEMA_VERSION,
    date,
    tasks: normalized,
    createdAt: now,
    updatedAt: now,
  };
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
