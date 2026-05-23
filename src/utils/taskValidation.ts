// =====================================================================
// src/utils/taskValidation.ts
// =====================================================================
// 時刻の重複検出。純粋関数のみ。React にも LocalStorage にも依存しない。
//
// なぜここに切り出すか:
//   - 「重複したか?」の判定を単一の関数に閉じてテスト可能にする
//   - hook (usePlanner) と UI (AddTaskModal) の両方から同じロジックを呼ぶ
//   - Architecture 7.1「コンポーネントは表示のみ」の原則に従う
//
// 半開区間 [startSlot, startSlot + durationSlots) で重複判定する。
// 端点同値 (例: A が 7:00 終わり、B が 7:00 始まり) は重複とみなさない。
// =====================================================================

import type { Task } from "../store/types";

export interface ConflictInfo {
  taskId: string;
  title: string;
  startSlot: number;
  durationSlots: number;
  isLocked: boolean;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; conflict: ConflictInfo };

export interface CandidateSlot {
  startSlot: number;
  durationSlots: number;
}

// 候補の時間帯が既存タスク群と重複するかを返す。
// excludeTaskId: 編集モードで自タスクを衝突相手とみなさないため。
// 複数衝突がある場合は配列の最初に見つかったものを返す
// (UX 的に「ひとつずつ直せばいい」状態を作るため)。
export function validateTaskTime(
  candidate: CandidateSlot,
  existing: readonly Task[],
  excludeTaskId?: string,
): ValidationResult {
  const candStart = candidate.startSlot;
  const candEnd = candidate.startSlot + candidate.durationSlots;

  for (const t of existing) {
    if (excludeTaskId !== undefined && t.id === excludeTaskId) continue;

    const tStart = t.startSlot;
    const tEnd = t.startSlot + t.durationSlots;

    // 半開区間オーバーラップ: candStart < tEnd && tStart < candEnd
    if (candStart < tEnd && tStart < candEnd) {
      return {
        ok: false,
        conflict: {
          taskId: t.id,
          title: t.title,
          startSlot: t.startSlot,
          durationSlots: t.durationSlots,
          isLocked: t.isLocked,
        },
      };
    }
  }
  return { ok: true };
}
