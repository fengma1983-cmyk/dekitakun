// =====================================================================
// src/store/AppContext.tsx
// =====================================================================
// アプリ全体の状態を 1 本の reducer で管理する Context。
//
// なぜ Context + useReducer か (Architecture 5.1):
//   - Phase 1〜3 ではサーバを持たない (LocalStorage のみ)
//   - 大部分の更新はタスク単位のシンプルな変更
//   - Redux や Zustand を入れるほどの規模ではない
//   - reducer の pure 関数性がテスト容易
//
// 今回 (Phase 1-α) 実装する action:
//   ADD_TASK / UPDATE_TASK / COMPLETE_TASK / START_TIMER / STOP_TIMER / DELETE_TASK
//
// 型だけ定義して本体は後続スライスで実装する action:
//   PAUSE_TASK (Phase 1-δ で使用。invitation layer と連動)
//   POSTPONE_TASK (Phase 1-δ)
//   INVITE_RESPONSE (Phase 1-δ)
//   SAVE_TOMORROW_SEED (Phase 3)
//   CARRY_TASK (Phase 1-δ 以降。自動遷移ロジックが揃ってから)
//   ADD_POINTS (Phase 2)
//   SAVE_REVIEW (Phase 3)
// =====================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  AchievementState,
  AppSettings,
  Category,
  DailyReview,
  DayPlan,
  InvitationHistory,
  InvitationResponse,
  InvitationType,
  Subject,
  Task,
} from "./types";
import {
  buildSeedDayPlan,
  isSeeded,
  loadAchievement,
  loadCategories,
  loadDayPlan,
  loadInvitationHistory,
  loadSettings,
  loadSubjects,
  markSeeded,
  saveAchievement,
  saveDayPlan,
  saveInvitationHistory,
  saveSettings,
  todayIso,
} from "../utils/storage";
import { raise } from "../utils/assert";
import { POINTS } from "../config/defaults";

// =====================================================================
// AppState — グローバル状態の型
// =====================================================================

export interface ActiveInvitation {
  type: InvitationType;
  taskId: string;
  shownAt: string;
}

export interface AppState {
  currentDate: string;                      // "YYYY-MM-DD"
  dayPlan: DayPlan | null;
  categories: Category[];
  subjects: Subject[];
  achievement: AchievementState;
  settings: AppSettings;
  activeTimerTaskId: string | null;

  // v1.1 追加 (Phase 1-δ 以降で活用)
  invitationHistory: InvitationHistory;
  activeInvitation: ActiveInvitation | null;
  dayEndMode: boolean;                      // 21:30 以降

  // UI 一時状態
  celebratingTaskId: string | null;         // 完了演出中のタスク ID
}

// =====================================================================
// AppAction — 全アクション型
// =====================================================================
// 注: 実装範囲は reducer の case を参照。型定義は全て書いておくことで、
//     後続スライスで「action 型から追加」「reducer に case 追加」の
//     2 ステップで済む。
// =====================================================================

export type AppAction =
  // --- Phase 1-α で実装 -----------------------------------------
  | { type: "HYDRATE"; payload: Pick<AppState,
        "dayPlan" | "categories" | "subjects" | "achievement" |
        "settings" | "invitationHistory" | "currentDate" | "dayEndMode"> }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: { id: string; changes: Partial<Task> } }
  | { type: "DELETE_TASK"; payload: { id: string } }
  | { type: "COMPLETE_TASK"; payload: { id: string; actualMinutes: number } }
  | { type: "START_TIMER"; payload: { taskId: string } }
  | { type: "STOP_TIMER" }
  | { type: "CLEAR_CELEBRATION" }

  // --- 型のみ先行定義。case 本体は後続スライス ------------------
  | { type: "CARRY_TASK"; payload: { id: string } }
  | { type: "PAUSE_TASK"; payload: { id: string; progressMinutes: number } }
  | { type: "POSTPONE_TASK"; payload: { id: string; targetDate?: string; targetSlot?: number } }
  | { type: "INVITE_RESPONSE"; payload: { taskId: string; type: InvitationType; response: InvitationResponse } }
  | { type: "SAVE_TOMORROW_SEED"; payload: { date: string; seed: string } }
  | { type: "ADD_POINTS"; payload: number }
  | { type: "SAVE_REVIEW"; payload: DailyReview };

// =====================================================================
// 初期状態ビルダー (同期版)
// =====================================================================
// なぜ LocalStorage の読み込みを useReducer の initializer 側で行うか
// (Phase 1-α bug 修正):
//   以前は useEffect 内で load → HYDRATE dispatch の二段構えだった。
//   しかしその構成だと初回 mount 時、HYDRATE が適用される「前」に
//   save 系の useEffect (saveAchievement など) が初期の空 state を
//   LocalStorage に上書きしてしまう競合が発生する。
//   React 18 StrictMode (dev) では effect が 2 度走るため、2 度目の
//   load が既にクリアされた LocalStorage を読み、totalPoints が
//   そのまま 0 に固定される (iPad Safari 実機でのポイント消失の原因)。
//
//   useReducer(initializer) は StrictMode でも 2 回呼ばれるが、内部の
//   副作用 (saveDayPlan / markSeeded) はすべて冪等なので問題なし。
//   初期 state = 永続化済みの内容、と出発点を揃えることで
//   「まだ hydrate してないのに save effect が走る」状態を根絶する。
// =====================================================================

function buildInitialState(): AppState {
  const today = todayIso();
  let dayPlan = loadDayPlan(today);

  if (!isSeeded() && !dayPlan) {
    dayPlan = buildSeedDayPlan(today);
    saveDayPlan(today, dayPlan);
    markSeeded();
  }

  return {
    currentDate: today,
    dayPlan,
    categories: loadCategories(),
    subjects: loadSubjects(),
    achievement: loadAchievement(),
    settings: loadSettings(),
    activeTimerTaskId: null,
    invitationHistory: loadInvitationHistory(today),
    activeInvitation: null,
    dayEndMode: computeDayEndMode(new Date()),
    celebratingTaskId: null,
  };
}

// =====================================================================
// reducer
// =====================================================================

const NOT_YET = "not yet implemented in Phase 1-α slice";

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ---------------------------------------------------------------
    case "HYDRATE":
      return { ...state, ...action.payload };

    // ---------------------------------------------------------------
    case "ADD_TASK": {
      if (!state.dayPlan) return state;
      return {
        ...state,
        dayPlan: {
          ...state.dayPlan,
          tasks: [...state.dayPlan.tasks, action.payload],
        },
      };
    }

    // ---------------------------------------------------------------
    case "UPDATE_TASK": {
      if (!state.dayPlan) return state;
      const { id, changes } = action.payload;
      return {
        ...state,
        dayPlan: {
          ...state.dayPlan,
          tasks: state.dayPlan.tasks.map((t) =>
            t.id === id ? { ...t, ...changes } : t,
          ),
        },
      };
    }

    // ---------------------------------------------------------------
    case "DELETE_TASK": {
      if (!state.dayPlan) return state;
      return {
        ...state,
        dayPlan: {
          ...state.dayPlan,
          tasks: state.dayPlan.tasks.filter((t) => t.id !== action.payload.id),
        },
      };
    }

    // ---------------------------------------------------------------
    case "COMPLETE_TASK": {
      if (!state.dayPlan) return state;
      const { id, actualMinutes } = action.payload;
      const now = new Date().toISOString();

      // 二重加算防止: 既に done なタスクを再度 COMPLETE_TASK した場合は
      // ポイントを足さない。二重完了は UI 側でも防いでいるが、
      // reducer 自身も冪等に保つ (バグの影響範囲を狭めるため)。
      const target = state.dayPlan.tasks.find((t) => t.id === id);
      const shouldAwardPoints = target !== undefined && target.status !== "done";

      return {
        ...state,
        activeTimerTaskId:
          state.activeTimerTaskId === id ? null : state.activeTimerTaskId,
        celebratingTaskId: id,
        dayPlan: {
          ...state.dayPlan,
          tasks: state.dayPlan.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "done", actualMinutes, completedAt: now }
              : t,
          ),
        },
        // Phase 1-α の暫定: 通常タスクの基本ポイントのみを加算。
        // challengeBonus / 集中トラックの ★ / バッジ解放などは Phase 2。
        // 「複数トラック合算で totalPoints を構成する」が PRD 3.1 の本来の設計。
        achievement: shouldAwardPoints
          ? {
              ...state.achievement,
              totalPoints: state.achievement.totalPoints + POINTS.taskComplete,
            }
          : state.achievement,
      };
    }

    // ---------------------------------------------------------------
    case "START_TIMER":
      return { ...state, activeTimerTaskId: action.payload.taskId };

    case "STOP_TIMER":
      return { ...state, activeTimerTaskId: null };

    case "CLEAR_CELEBRATION":
      return { ...state, celebratingTaskId: null };

    // ---------------------------------------------------------------
    // 以下は型定義済み、実装は後続スライス。
    // なぜ throw にするか: 無音で何もしない reducer は最悪の体験
    //   (action を dispatch したのに状態が変わらない)。
    //   開発中は throw して気付ける方が良い。
    // 本番前に全て実装されることを Definition of Done で保証する。
    // ---------------------------------------------------------------
    // ---------------------------------------------------------------
    case "ADD_POINTS": {
      // Phase 1-α での実装範囲: totalPoints のインクリメントのみ。
      // なぜここだけ先行実装するか:
      //   息子にタスク完了で数字が動くフィードバックを最速で見せるため。
      //   challengeBonus 分岐、バッジ解放、streakDays、invitationStartRate 等の
      //   records 更新、成長ツリーは Phase 2 でまとめて実装する。
      return {
        ...state,
        achievement: {
          ...state.achievement,
          totalPoints: state.achievement.totalPoints + action.payload,
        },
      };
    }

    // ---------------------------------------------------------------
    case "CARRY_TASK":
    case "PAUSE_TASK":
    case "POSTPONE_TASK":
    case "INVITE_RESPONSE":
    case "SAVE_TOMORROW_SEED":
    case "SAVE_REVIEW":
      raise(`${action.type}: ${NOT_YET}`);

    default: {
      // 網羅性チェック: 新 action を型に追加したら、ここで型エラーが出る。
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

// =====================================================================
// Context
// =====================================================================

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  // Persistence: state が変わるたびに永続化。
  // なぜ effect で書くか: reducer を純粋に保ち、I/O を分離する。
  // 初期 state は buildInitialState で既に LocalStorage と一致しているため、
  // mount 直後の最初の save は実質 no-op (同じ値を書き戻すだけ)。
  useEffect(() => {
    if (state.dayPlan) saveDayPlan(state.currentDate, state.dayPlan);
  }, [state.dayPlan, state.currentDate]);

  useEffect(() => {
    saveAchievement(state.achievement);
  }, [state.achievement]);

  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    saveInvitationHistory(state.currentDate, state.invitationHistory);
  }, [state.invitationHistory, state.currentDate]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// =====================================================================
// hook
// =====================================================================

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    raise("useAppContext must be used within <AppProvider>");
  }
  return ctx;
}

// =====================================================================
// ヘルパー
// =====================================================================

function computeDayEndMode(now: Date): boolean {
  const h = now.getHours();
  const m = now.getMinutes();
  return h > 21 || (h === 21 && m >= 30);
}
