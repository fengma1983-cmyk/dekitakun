// 時間スロット変換ユーティリティ
// 1スロット = 15分、スロット0 = 06:00、スロット65 = 22:15（終端22:30）

export const SLOT_COUNT    = 66;
export const SLOT_HEIGHT   = 32;
export const DAY_START_HOUR = 6;

export function slotToTime(slot: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + slot * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToSlot(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h * 60 + m - DAY_START_HOUR * 60) / 15;
}

export function slotsToDuration(durationSlots: number): string {
  const mins = durationSlots * 15;
  if (mins < 60) return `${mins}分`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}
