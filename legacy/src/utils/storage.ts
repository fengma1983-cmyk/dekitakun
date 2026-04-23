import type {
  Task,
  DayPlan,
  AchievementState,
  Category,
  Subject,
  AppSettings,
} from "../types";

const CURRENT_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  DAY_PLAN:       (date: string) => `jk_dayplan_${date}`,
  CATEGORIES:     "jk_categories",
  SUBJECTS:       "jk_subjects",
  ACHIEVEMENT:    "jk_achievement",
  SETTINGS:       "jk_settings",
  SCHEMA_VERSION: "jk_schema_version",
} as const;

// ─── 低レベルヘルパー ─────────────────────────────────────────────────────────

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ストレージ容量超過など。静默処理
  }
}

// ─── マイグレーション ─────────────────────────────────────────────────────────

type RawData = Record<string, unknown>;

function migrateV0toV1(data: RawData): RawData {
  const tasks = data.tasks as Array<RawData> | undefined;
  return {
    ...data,
    tasks: tasks?.map((t) => ({
      ...t,
      status: t.completed ? "done" : "planned",
    })) ?? [],
  };
}

function applyMigrations(data: RawData): RawData {
  const version = (data.version as number | undefined) ?? 0;
  let migrated = { ...data };
  if (version < 1) migrated = migrateV0toV1(migrated);
  migrated.version = CURRENT_SCHEMA_VERSION;
  return migrated;
}

export function migrateIfNeeded(): void {
  try {
    const storedVersion = read<number>(STORAGE_KEYS.SCHEMA_VERSION) ?? 0;
    if (storedVersion >= CURRENT_SCHEMA_VERSION) return;

    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("jk_dayplan_")) keysToMigrate.push(key);
    }
    for (const key of keysToMigrate) {
      const raw = read<RawData>(key);
      if (!raw) continue;
      const version = (raw.version as number | undefined) ?? 0;
      if (version < CURRENT_SCHEMA_VERSION) write(key, applyMigrations(raw));
    }

    const achievement = read<RawData>(STORAGE_KEYS.ACHIEVEMENT);
    if (achievement) {
      const version = (achievement.version as number | undefined) ?? 0;
      if (version < CURRENT_SCHEMA_VERSION) {
        write(STORAGE_KEYS.ACHIEVEMENT, applyMigrations(achievement));
      }
    }

    write(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
  } catch {
    // マイグレーション中の例外も静默処理
  }
}

// ─── DayPlan ──────────────────────────────────────────────────────────────────

function withMigration<T>(key: string): T | null {
  const raw = read<RawData>(key);
  if (!raw) return null;
  const version = (raw.version as number | undefined) ?? 0;
  if (version < CURRENT_SCHEMA_VERSION) {
    const migrated = applyMigrations(raw);
    write(key, migrated);
    return migrated as unknown as T;
  }
  return raw as unknown as T;
}

export function getDayPlan(dateKey: string): DayPlan | null {
  return withMigration<DayPlan>(STORAGE_KEYS.DAY_PLAN(dateKey));
}

export function saveDayPlan(dateKey: string, tasks: Task[]): void {
  const key = STORAGE_KEYS.DAY_PLAN(dateKey);
  const existing = getDayPlan(dateKey);
  const now = new Date().toISOString();
  const plan: DayPlan = {
    version: CURRENT_SCHEMA_VERSION,
    date: dateKey,
    tasks,
    review: existing?.review,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  write(key, plan);
}

// ─── AchievementState ─────────────────────────────────────────────────────────

const DEFAULT_ACHIEVEMENT: AchievementState = {
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

export function getAchievementState(): AchievementState {
  const result = withMigration<AchievementState>(STORAGE_KEYS.ACHIEVEMENT);
  return result ?? { ...DEFAULT_ACHIEVEMENT };
}

export function saveAchievementState(state: AchievementState): void {
  write(STORAGE_KEYS.ACHIEVEMENT, { ...state, version: CURRENT_SCHEMA_VERSION });
}

// ─── Categories / Subjects / Settings ─────────────────────────────────────────

export function getCategories(): Category[] | null {
  return read<Category[]>(STORAGE_KEYS.CATEGORIES);
}
export function saveCategories(categories: Category[]): void {
  write(STORAGE_KEYS.CATEGORIES, categories);
}

export function getSubjects(): Subject[] | null {
  return read<Subject[]>(STORAGE_KEYS.SUBJECTS);
}
export function saveSubjects(subjects: Subject[]): void {
  write(STORAGE_KEYS.SUBJECTS, subjects);
}

export function getSettings(): AppSettings | null {
  return read<AppSettings>(STORAGE_KEYS.SETTINGS);
}
export function saveSettings(settings: AppSettings): void {
  write(STORAGE_KEYS.SETTINGS, settings);
}
