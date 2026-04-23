import { useState, useCallback, useEffect } from "react";
import { getDayPlan, saveDayPlan } from "../utils/storage";
import type { Task } from "../types";

export type DisplayMode = "all" | "head" | "gaps";

export function useTimeGrid(dateKey: string) {
  const [tasks, setTasks] = useState<Task[]>(
    () => {
      const loaded = getDayPlan(dateKey)?.tasks ?? [];
      console.log(`[useTimeGrid] init: date=${dateKey}, tasks=${loaded.length}`);
      return loaded;
    }
  );
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");

  useEffect(() => {
    const loaded = getDayPlan(dateKey)?.tasks ?? [];
    console.log(`[useTimeGrid] dateKey changed → ${dateKey}, tasks=${loaded.length}`);
    setTasks(loaded);
  }, [dateKey]);

  // Bug Fix: stale closure を避けるため setTasks(prev=>) パターンに統一
  // 旧実装は tasks をクロージャで捕捉するため、連続操作で古い値を参照する可能性があった

  const addTask = useCallback((task: Task) => {
    setTasks(prev => {
      const next = [...prev, task];
      saveDayPlan(dateKey, next);
      console.log(`[useTimeGrid] addTask: "${task.title}" slot=${task.startSlot}, total=${next.length}`);
      return next;
    });
  }, [dateKey]);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...changes } : t);
      saveDayPlan(dateKey, next);
      console.log(`[useTimeGrid] updateTask: id=${id}`, changes);
      return next;
    });
  }, [dateKey]);

  const completeTask = useCallback((id: string, actualMinutes: number) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === id
          ? { ...t, status: "done" as const, actualMinutes, completedAt: new Date().toISOString() }
          : t
      );
      saveDayPlan(dateKey, next);
      const completed = next.find(t => t.id === id);
      console.log(`[useTimeGrid] completeTask: "${completed?.title}", actualMinutes=${actualMinutes}`);
      return next;
    });
  }, [dateKey]);

  // "carried"を使う。"failed"はユーザーに失敗感を与えるため使用禁止（PRD 3.3参照）
  const carryTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, status: "carried" as const } : t);
      saveDayPlan(dateKey, next);
      const carried = next.find(t => t.id === id);
      console.log(`[useTimeGrid] carryTask: "${carried?.title}" → 待続`);
      return next;
    });
  }, [dateKey]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      saveDayPlan(dateKey, next);
      console.log(`[useTimeGrid] deleteTask: "${target?.title}", remaining=${next.length}`);
      return next;
    });
  }, [dateKey]);

  const uncompleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, status: "planned" as const, completedAt: undefined, actualMinutes: undefined } : t);
      saveDayPlan(dateKey, next);
      console.log(`[useTimeGrid] uncompleteTask: id=${id} → planned`);
      return next;
    });
  }, [dateKey]);

  return { tasks, displayMode, setDisplayMode, addTask, updateTask, completeTask, carryTask, deleteTask, uncompleteTask };
}
