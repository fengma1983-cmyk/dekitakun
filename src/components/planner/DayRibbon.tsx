// =====================================================================
// DayRibbon.tsx — 横向き 1 日 ribbon
// =====================================================================
// iPad 横向き (1194×834) 最適化。Claude Design B variant。
// あさ / がっこう / ほうかご / よる の 4 帯を背景色で分け、
// その上にタスクブロックを絶対配置する。
//
// なぜ絶対配置 + % か:
//   画面幅の違い (1024 / 1194 / 1366 等) に対応。スロット数 (64) で
//   均等に割るためドラッグ拡張の実装も素直になる (Phase 1-β 以降)。
//
// なぜ「よる」だけ dark テーマか:
//   一日のクロージングを色で示す (defaults.ts 参照)。
// =====================================================================

import { useMemo } from "react";
import type { Category, Task } from "../../store/types";
import { DAY_BANDS, TIME_CONFIG } from "../../config/defaults";
import { RADIUS } from "../../config/theme";
import { TaskBlock } from "./TaskBlock";
import { NowIndicator } from "./NowIndicator";

interface Props {
  tasks: Task[];
  categories: Category[];
  // なぜ rect を渡すか: タップされたブロックの画面上の位置を基準に
  // TaskDetailPopover を配置するため。取得は TaskBlock 内部で
  // e.currentTarget.getBoundingClientRect() で行う。
  onTaskClick: (task: Task, anchorRect: DOMRect) => void;
  onEmptyClick: (approximateStartSlot: number) => void;
}

export function DayRibbon({ tasks, categories, onTaskClick, onEmptyClick }: Props) {
  const totalSlots = TIME_CONFIG.totalSlots;

  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const handleRibbonClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // クリックされた X 座標からおよそのスロットを算出。
    // 既存タスクブロックのクリックは TaskBlock 側で stopPropagation される。
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, x / rect.width));
    const slot = Math.floor(fraction * totalSlots);
    // 15 分グリッドに吸着
    onEmptyClick(slot);
  };

  return (
    <div
      aria-label="きょうの じかんわり"
      style={{
        position: "relative",
        width: "100%",
        height: 220,
        background: "#fff",
        borderRadius: RADIUS.lg,
        boxShadow: "0 2px 12px rgba(0,0,0,.06)",
        overflow: "hidden",
        cursor: "crosshair",
      }}
      onClick={handleRibbonClick}
    >
      {/* 4 帯の背景 */}
      {DAY_BANDS.map((band) => {
        const leftPercent = (band.startSlot / totalSlots) * 100;
        const widthPercent = ((band.endSlot - band.startSlot) / totalSlots) * 100;
        return (
          <div
            key={band.id}
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              background: band.color,
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: band.dark ? "#FFFFFF" : "#4A5568",
                letterSpacing: 1,
              }}
            >
              {band.label}
            </div>
          </div>
        );
      })}

      {/* タスクブロック群 */}
      {tasks.map((task) => {
        // なぜ clamp するか (Phase 1-α bug 修正):
        //   durationSlots が大きい / startSlot が末尾に近いと、
        //   leftPercent + widthPercent が 100% を超えて ribbon の
        //   右端を突き抜ける。iPad Pro 11" 横向きで最終タスク
        //   (21:45 起点等) が画面外に滑り落ちて見えなくなる症状が出た。
        //   content-driven な「タスク長に比例した幅」は保ったまま、
        //   末尾は ribbon 内に収まるよう widthPercent を頭切りする。
        const rawLeft  = (task.startSlot     / totalSlots) * 100;
        const rawWidth = (task.durationSlots / totalSlots) * 100;
        const leftPercent  = Math.max(0, Math.min(rawLeft, 100));
        const widthPercent = Math.max(0, Math.min(rawWidth, 100 - leftPercent));
        if (widthPercent === 0) return null;   // 画面外まで押し出されたら描画しない
        return (
          <div
            key={task.id}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              zIndex: 2,
            }}
          >
            <TaskBlock
              task={task}
              category={categoryById.get(task.categoryId)}
              onClick={(rect) => onTaskClick(task, rect)}
            />
          </div>
        );
      })}

      {/* いまピン */}
      <NowIndicator />
    </div>
  );
}
