// =====================================================================
// src/utils/timeUtils.ts
// =====================================================================
// 時間軸 (15 分スロット ↔ HH:MM) の単一出典。
//
// なぜ集約するか:
//   slot / hour / minute の変換は AddTaskModal、CONFLICT_MESSAGES、
//   今後の NowIndicator 計算など複数箇所で使う。式が分散すると
//   TIME_CONFIG.dayStartSlot を変えた時に追跡漏れが出る。
//
// なぜ format も同居させるか:
//   "7:00" のような表示文字列は messages.ts から呼ぶが、変換ロジック
//   そのものは数値計算なので utils 側にある方が自然 (messages.ts は
//   文案テンプレートに集中)。
// =====================================================================

import { TIME_CONFIG } from "../config/defaults";

export function slotToHourMin(slot: number): { hour: number; minute: number } {
  const totalMin =
    TIME_CONFIG.dayStartSlot * TIME_CONFIG.slotMinutes +
    slot * TIME_CONFIG.slotMinutes;
  return { hour: Math.floor(totalMin / 60), minute: totalMin % 60 };
}

export function hourMinToSlot(hour: number, minute: number): number {
  const totalMin = hour * 60 + minute;
  return Math.round(
    (totalMin - TIME_CONFIG.dayStartSlot * TIME_CONFIG.slotMinutes) /
      TIME_CONFIG.slotMinutes,
  );
}

// 時刻を "H:MM" で整形 (時は 1 桁許容、分は 2 桁ゼロ詰め)。
// 例: slot 2 → "6:30"、slot 8 → "8:00"、slot 34 → "14:30"
export function formatHourMin(slot: number): string {
  const { hour, minute } = slotToHourMin(slot);
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

// 開始 slot と長さから "開始–終了" 文字列を作る。
// 例: (2, 2) → "6:30–7:00"、(8, 26) → "8:00–14:30"
export function formatSlotRange(
  startSlot: number,
  durationSlots: number,
): string {
  return `${formatHourMin(startSlot)}–${formatHourMin(startSlot + durationSlots)}`;
}
