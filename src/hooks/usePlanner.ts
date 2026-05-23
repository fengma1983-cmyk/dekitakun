// =====================================================================
// src/hooks/usePlanner.ts
// =====================================================================
// 時間割の CRUD と状態遷移の入口。
//
// なぜ hook にまとめるか (Architecture 5.2 / 7.1):
//   - コンポーネントは「表示」に集中。計算と dispatch はここに。
//   - タスク状態遷移のルール (planned → inProgress → done 等) を
//     ここに集約することで、ばらついた更新を防ぐ。
//
// Phase 1-α で実装:
//   addTask / updateTask / deleteTask / completeTask / clearCelebration
//
// 型だけ定義して throw する (Phase 1-δ 以降):
//   pauseTask / postponeTask / carryTask
// =====================================================================

import { useCallback } from "react";
import { useAppContext } from "../store/AppContext";
import type { DifficultyLevel, Task } from "../store/types";
import { raise } from "../utils/assert";
import {
  validateTaskTime,
  type ConflictInfo,
} from "../utils/taskValidation";

function makeId(): string {
  // Phase 1-α は衝突確率の低い簡易 ID で十分。
  return `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export interface AddTaskInput {
  title: string;
  icon?: string;
  categoryId: string;
  subjectId?: string;
  startSlot: number;
  durationSlots: number;
  difficulty: DifficultyLevel;
}

// バッチ B で導入: 時刻重複時は dispatch せず { ok: false, conflict } を返す。
// なぜ throw でなく結果型にするか:
//   重複は「正常な業務状態」(子どもが入力中の途中) で発生しうる。
//   throw は予期しない不変条件違反のために予約する (assert.ts の方針)。
// なぜ呼び出し側 (App.tsx) が無視しても安全か:
//   AddTaskModal が pre-save 段階で validateTaskTime を直接呼び、
//   重複があれば「ほぞん / ついか」ボタンを disable にしている。
//   この hook 側はクロスタブ等のレース時に最後の砦として機能する。
export type AddTaskResult =
  | { ok: true; task: Task }
  | { ok: false; conflict: ConflictInfo };

export type UpdateTaskResult =
  | { ok: true }
  | { ok: false; conflict: ConflictInfo };

export function usePlanner() {
  const { state, dispatch } = useAppContext();

  const addTask = useCallback(
    (input: AddTaskInput): AddTaskResult => {
      const tasks = state.dayPlan?.tasks ?? [];
      const validation = validateTaskTime(
        { startSlot: input.startSlot, durationSlots: input.durationSlots },
        tasks,
      );
      if (!validation.ok) {
        return { ok: false, conflict: validation.conflict };
      }

      const task: Task = {
        id: makeId(),
        title: input.title,
        icon: input.icon,
        categoryId: input.categoryId,
        subjectId: input.subjectId,
        startSlot: input.startSlot,
        durationSlots: input.durationSlots,
        plannedMinutes: input.durationSlots * 15,
        difficulty: input.difficulty,
        status: "planned",
        isLocked: false,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TASK", payload: task });
      return { ok: true, task };
    },
    [dispatch, state.dayPlan],
  );

  const updateTask = useCallback(
    (id: string, changes: Partial<Task>): UpdateTaskResult => {
      const tasks = state.dayPlan?.tasks ?? [];
      const target = tasks.find((t) => t.id === id);

      // 時刻 / 長さ系の変更が含まれる時だけ重複チェックを行う。
      // タイトル / カテゴリだけの編集で誤検知させない。
      const startSlot = changes.startSlot ?? target?.startSlot;
      const durationSlots = changes.durationSlots ?? target?.durationSlots;
      if (startSlot !== undefined && durationSlots !== undefined) {
        const validation = validateTaskTime(
          { startSlot, durationSlots },
          tasks,
          id, // 編集モード: 自タスクは衝突相手から除外
        );
        if (!validation.ok) {
          return { ok: false, conflict: validation.conflict };
        }
      }

      dispatch({ type: "UPDATE_TASK", payload: { id, changes } });
      return { ok: true };
    },
    [dispatch, state.dayPlan],
  );

  const deleteTask = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_TASK", payload: { id } });
    },
    [dispatch],
  );

  const completeTask = useCallback(
    (id: string, actualMinutes?: number) => {
      // Phase 1-α はタイマー UI なしなので actualMinutes は plannedMinutes で近似。
      // Phase 1-γ で専注モードの計測値に置き換える。
      const task = state.dayPlan?.tasks.find((t) => t.id === id);
      const fallback = task?.plannedMinutes ?? 0;
      dispatch({
        type: "COMPLETE_TASK",
        payload: { id, actualMinutes: actualMinutes ?? fallback },
      });
    },
    [dispatch, state.dayPlan],
  );

  const clearCelebration = useCallback(() => {
    dispatch({ type: "CLEAR_CELEBRATION" });
  }, [dispatch]);

  // ---------------------------------------------------------------
  // 状態遷移 (Phase 1-δ で本実装)
  // 現在は signature だけ保ち、呼び出されたら例外を投げる。
  // なぜ throw にするか: サイレントに無反応だとバグに気付きにくい。
  // これらは invitation layer との連携が前提なので、その層が揃うまで
  // 実装しない方が整合性が保てる。
  // ---------------------------------------------------------------

  const pauseTask = useCallback(
    (_id: string, _progressMinutes: number): void => {
      raise("pauseTask: not yet implemented in Phase 1-alpha slice");
    },
    [],
  );

  const postponeTask = useCallback(
    (_id: string, _opts?: { targetDate?: string; targetSlot?: number }): void => {
      raise("postponeTask: not yet implemented in Phase 1-alpha slice");
    },
    [],
  );

  const carryTask = useCallback(
    (_id: string): void => {
      raise("carryTask: not yet implemented in Phase 1-alpha slice");
    },
    [],
  );

  return {
    tasks: state.dayPlan?.tasks ?? [],
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    clearCelebration,
    pauseTask,
    postponeTask,
    carryTask,
  };
}
