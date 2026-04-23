import React, { useRef, useState, useCallback } from "react";
import type { Task, DifficultyLevel } from "../../types";
import { CATEGORY_MAP } from "../../config/categories";
import type { DisplayMode } from "../../hooks/useTimeGrid";
import { slotToTime, slotsToDuration, SLOT_COUNT, SLOT_HEIGHT } from "../../utils/timeUtils";

// ─── 表示ヘルパー ─────────────────────────────────────────────────────────────

function buildTaskMap(tasks: Task[]): Record<number, Task> {
  const map: Record<number, Task> = {};
  for (const t of tasks) {
    for (let s = t.startSlot; s < t.startSlot + t.durationSlots; s++) {
      map[s] = t;
    }
  }
  return map;
}

function getHiddenSlots(tasks: Task[], mode: DisplayMode): Set<number> {
  const taskMap = buildTaskMap(tasks);
  if (mode === "all") return new Set();

  if (mode === "head") {
    const firstSlot = tasks.length > 0 ? Math.min(...tasks.map((t) => t.startSlot)) : SLOT_COUNT;
    const hidden = new Set<number>();
    for (let s = 0; s < firstSlot; s++) {
      if (!taskMap[s]) hidden.add(s);
    }
    return hidden;
  }

  // gaps: タスクが入っていない全スロット非表示
  const hidden = new Set<number>();
  for (let s = 0; s < SLOT_COUNT; s++) {
    if (!taskMap[s]) hidden.add(s);
  }
  return hidden;
}

function difficultyStars(d: DifficultyLevel): string {
  if (d === "easy")   return "★";
  if (d === "normal") return "★★";
  return "★★★";
}

// ─── TaskBlockRow ─────────────────────────────────────────────────────────────

interface TaskBlockRowProps {
  task: Task;
  isFlashing: boolean;
  onFlashEnd: () => void;
  onSingleClick: (task: Task) => void;
  onDoubleClick: (task: Task) => void;
}

function TaskBlockRow({ task, isFlashing, onFlashEnd, onSingleClick, onDoubleClick }: TaskBlockRowProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cat      = CATEGORY_MAP[task.categoryId];
  const color    = cat ? `#${cat.color}` : "#ADB5BD";
  const isDone     = task.status === "done";
  const isCarried  = task.status === "carried";
  const blockH   = task.durationSlots * SLOT_HEIGHT - 4;

  const handleClick = () => {
    if (task.isLocked) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onDoubleClick(task);
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onSingleClick(task);
      }, 260);
    }
  };

  const prefix    = isDone ? "✓ " : isCarried ? "↻ " : `${cat?.icon ?? ""} `;
  const titleText = isCarried ? `待続 ${task.title}` : task.title;

  return (
    <div style={{ display: "flex", position: "relative", minHeight: SLOT_HEIGHT }}>
      <div style={css.timeLabel}>{slotToTime(task.startSlot)}</div>
      <div style={{ flex: 1, borderLeft: "2px solid #E0E7FF", position: "relative", minHeight: blockH + 4 }}>
        <div
          onClick={handleClick}
          className={isFlashing ? "task-done-flash" : undefined}
          onAnimationEnd={onFlashEnd}
          style={{
            position: "absolute", top: 2, left: 5, right: 5,
            height: blockH, borderRadius: 9, padding: "4px 8px",
            cursor: task.isLocked ? "default" : "pointer",
            display: "flex", flexDirection: "column", justifyContent: "center",
            userSelect: "none", border: "1.5px solid rgba(0,0,0,0.08)",
            backgroundColor: isDone ? `${color}bb` : color,
            opacity: isDone ? 0.88 : 1,
          }}
        >
          {isFlashing && <span className="celebration-pop">🎉</span>}
          <div style={css.taskTitle}>{prefix}{titleText}</div>
          {task.durationSlots >= 2 && (
            <div style={css.taskSub}>
              {slotsToDuration(task.durationSlots)} · {difficultyStars(task.difficulty)}
              {task.isLocked && " 🔒"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EmptySlotRow ─────────────────────────────────────────────────────────────

interface EmptySlotRowProps {
  slot: number;
  onSlotClick: (slot: number) => void;
}

function EmptySlotRow({ slot, onSlotClick }: EmptySlotRowProps) {
  // 30分ごと（slot % 2 === 0）に時刻表示
  const showTime = slot % 2 === 0;
  const isHour   = slot % 4 === 0;
  return (
    <div style={{ display: "flex", minHeight: SLOT_HEIGHT }}>
      <div style={{ ...css.timeLabel, fontWeight: isHour ? 700 : 400, opacity: isHour ? 1 : 0.55 }}>
        {showTime ? slotToTime(slot) : ""}
      </div>
      <div
        onClick={() => onSlotClick(slot)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EDE9FF")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        style={{
          flex: 1, borderLeft: `2px solid ${isHour ? "#C7D0E8" : "#E0E7FF"}`,
          minHeight: SLOT_HEIGHT, cursor: "pointer", backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

// ─── GapRow ───────────────────────────────────────────────────────────────────

interface GapRowProps {
  startSlot: number;
  endSlot: number;
  onExpand: () => void;
}

function GapRow({ startSlot, endSlot, onExpand }: GapRowProps) {
  const gapMins = (endSlot - startSlot) * 15;
  return (
    <div onClick={onExpand} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0 4px 56px", cursor: "pointer" }}>
      <div style={{ flex: 1, borderTop: "1.5px dashed #E0E7FF" }} />
      <span style={{ fontSize: 11, color: "#8891B4", whiteSpace: "nowrap", background: "#F0F4FF", padding: "0 5px", borderRadius: 4 }}>
        ▸ {slotToTime(startSlot)}〜{slotToTime(endSlot)}（{gapMins}分 空き）
      </span>
      <div style={{ flex: 1, borderTop: "1.5px dashed #E0E7FF" }} />
    </div>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

const MODES: { mode: DisplayMode; label: string }[] = [
  { mode: "all",  label: "全表示" },
  { mode: "head", label: "先頭カット" },
  { mode: "gaps", label: "空白非表示" },
];

interface ModeToggleProps { current: DisplayMode; onChange: (m: DisplayMode) => void }

function ModeToggle({ current, onChange }: ModeToggleProps) {
  return (
    <div style={{ display: "flex", background: "#F0F4FF", borderRadius: 20, padding: 3, gap: 2 }}>
      {MODES.map(({ mode, label }) => (
        <button key={mode} onClick={() => onChange(mode)} style={{
          flex: 1, border: "none", borderRadius: 16, padding: "4px 8px",
          fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          backgroundColor: current === mode ? "#fff" : "transparent",
          color: current === mode ? "#6C63FF" : "#8891B4",
          boxShadow: current === mode ? "0 1px 4px rgba(108,99,255,0.15)" : "none",
        }}>{label}</button>
      ))}
    </div>
  );
}

// ─── TimeGrid（メインコンポーネント）─────────────────────────────────────────

export interface TimeGridProps {
  tasks: Task[];
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onSlotClick: (slot: number) => void;
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

export function TimeGrid({ tasks, displayMode, onDisplayModeChange, onSlotClick, onTaskClick, onTaskDoubleClick }: TimeGridProps) {
  const [flashId, setFlashId] = useState<string | null>(null);

  const taskMap     = buildTaskMap(tasks);
  const hiddenSlots = getHiddenSlots(tasks, displayMode);

  const handleDoubleClick = useCallback((task: Task) => {
    setFlashId(task.id);
    onTaskDoubleClick(task);
  }, [onTaskDoubleClick]);

  const rows: React.ReactNode[] = [];
  let s = 0;

  while (s < SLOT_COUNT) {
    if (hiddenSlots.has(s) && !taskMap[s]) {
      const gapStart = s;
      while (s < SLOT_COUNT && hiddenSlots.has(s) && !taskMap[s]) s++;
      rows.push(<GapRow key={`gap-${gapStart}`} startSlot={gapStart} endSlot={s} onExpand={() => onDisplayModeChange("all")} />);
      continue;
    }
    if (taskMap[s] && taskMap[s].startSlot === s) {
      const task = taskMap[s];
      rows.push(
        <TaskBlockRow
          key={task.id}
          task={task}
          isFlashing={flashId === task.id}
          onFlashEnd={() => setFlashId(null)}
          onSingleClick={onTaskClick}
          onDoubleClick={handleDoubleClick}
        />
      );
      s += task.durationSlots;
      continue;
    }
    if (!taskMap[s]) {
      rows.push(<EmptySlotRow key={`slot-${s}`} slot={s} onSlotClick={onSlotClick} />);
      s++;
      continue;
    }
    s++;
  }

  rows.push(
    <div key="end" style={{ display: "flex", minHeight: SLOT_HEIGHT }}>
      <div style={{ ...css.timeLabel, fontWeight: 700 }}>22:30</div>
      <div style={{ flex: 1, borderLeft: "2px solid #C7D0E8" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2D3A5E" }}>📅 じかんわり</span>
        <ModeToggle current={displayMode} onChange={onDisplayModeChange} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {tasks.length === 0 && (
          <div style={css.hint}>✏️ 時間をタップしてタスクを追加しよう！</div>
        )}
        {rows}
      </div>
    </div>
  );
}

const css = {
  timeLabel: {
    width: 48, flexShrink: 0, fontSize: 11, color: "#8891B4",
    textAlign: "right" as const, paddingRight: 8, paddingTop: 7, fontWeight: 600,
  },
  taskTitle: {
    fontSize: 12, fontWeight: 700, color: "#fff",
    overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis",
  },
  taskSub: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1 },
  hint: {
    fontSize: 12, color: "#8891B4", textAlign: "center" as const,
    padding: "8px 0 4px", marginBottom: 4,
  },
} as const;
