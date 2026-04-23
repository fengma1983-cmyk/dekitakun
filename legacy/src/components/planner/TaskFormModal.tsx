import React, { useState } from "react";
import type { Task, DifficultyLevel } from "../../types";
import { CATEGORIES } from "../../config/categories";
import { slotToTime, slotsToDuration } from "../../utils/timeUtils";

export interface TaskFormData {
  title: string;
  categoryId: string;
  durationSlots: number;
  difficulty: DifficultyLevel;
}

export interface TaskFormModalProps {
  mode: "add" | "edit";
  startSlot: number;
  initialData?: Partial<TaskFormData>;
  isDone?: boolean;
  onSave: (data: TaskFormData) => void;
  onDelete?: () => void;
  onToggleComplete?: () => void;
  onClose: () => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; stars: string }[] = [
  { value: "easy",      label: "かんたん", stars: "★" },
  { value: "normal",    label: "ふつう",   stars: "★★" },
  { value: "challenge", label: "がんばる", stars: "★★★" },
];

export function TaskFormModal({
  mode, startSlot, initialData, isDone,
  onSave, onDelete, onToggleComplete, onClose,
}: TaskFormModalProps) {
  const [title,        setTitle]    = useState(initialData?.title        ?? "");
  const [categoryId,   setCategory] = useState(initialData?.categoryId   ?? "homework");
  const [durationSlots, setDuration] = useState(initialData?.durationSlots ?? 2);
  const [difficulty,   setDiff]     = useState<DifficultyLevel>(initialData?.difficulty ?? "normal");

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ title: title.trim(), categoryId, durationSlots, difficulty });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={css.overlay} onClick={handleOverlayClick}>
      <div style={css.sheet}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2D3A5E" }}>
            {mode === "add" ? "✏️ タスクを追加" : "📝 タスクを編集"}
          </span>
          <button onClick={onClose} style={css.btnIcon}>✕</button>
        </div>

        {/* Time info */}
        <div style={{ fontSize: 12, color: "#8891B4", marginBottom: 14, background: "#F0F4FF", borderRadius: 8, padding: "6px 10px" }}>
          🕐 {slotToTime(startSlot)} 開始 · {slotsToDuration(durationSlots)}
          {isDone && <span style={{ marginLeft: 8, color: "#51CF66", fontWeight: 700 }}>✓ 完了済み</span>}
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="タスク名を入れよう"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          style={css.input}
          autoFocus
        />

        {/* Category */}
        <div style={css.sectionLabel}>カテゴリー</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                ...css.catBtn,
                backgroundColor: categoryId === cat.id ? `#${cat.color}` : "#F0F4FF",
                color:           categoryId === cat.id ? "#fff" : "#555",
                border:          `1.5px solid ${categoryId === cat.id ? `#${cat.color}` : "#E0E7FF"}`,
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Duration */}
        <div style={css.sectionLabel}>時間</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {DURATION_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              style={{
                ...css.chipBtn,
                backgroundColor: durationSlots === d ? "#6C63FF" : "#F0F4FF",
                color:           durationSlots === d ? "#fff"    : "#555",
                border:          `1.5px solid ${durationSlots === d ? "#6C63FF" : "#E0E7FF"}`,
              }}
            >
              {slotsToDuration(d)}
            </button>
          ))}
        </div>

        {/* Difficulty */}
        <div style={css.sectionLabel}>むずかしさ</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDiff(opt.value)}
              style={{
                ...css.diffBtn,
                backgroundColor: difficulty === opt.value ? "#FF6B9D" : "#F0F4FF",
                color:           difficulty === opt.value ? "#fff"    : "#555",
                border:          `1.5px solid ${difficulty === opt.value ? "#FF6B9D" : "#E0E7FF"}`,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: 1 }}>{opt.stars}</div>
              <div style={{ fontSize: 11, marginTop: 1 }}>{opt.label}</div>
            </button>
          ))}
        </div>

        {/* Primary save */}
        <button onClick={handleSave} disabled={!canSave} style={{ ...css.primaryBtn, opacity: canSave ? 1 : 0.45 }}>
          {mode === "add" ? "➕ 追加する" : "✓ 保存する"}
        </button>

        {/* Edit-only actions */}
        {mode === "edit" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {onToggleComplete && (
              <button onClick={onToggleComplete} style={css.secondaryBtn}>
                {isDone ? "↩ 未完了に戻す" : "✓ 完了にする"}
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={css.dangerBtn}>🗑 削除</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000,
  } as React.CSSProperties,
  sheet: {
    backgroundColor: "#fff", borderRadius: "20px 20px 0 0",
    padding: "20px 20px 36px", width: "100%", maxWidth: 520,
    boxShadow: "0 -4px 24px rgba(108,99,255,0.18)",
    maxHeight: "90vh", overflowY: "auto" as const,
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: "#8891B4",
    marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5,
  } as React.CSSProperties,
  input: {
    width: "100%", fontSize: 16, padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid #E0E7FF", outline: "none", fontFamily: "inherit",
    marginBottom: 14, boxSizing: "border-box" as const, color: "#2D3A5E",
  } as React.CSSProperties,
  btnIcon: {
    background: "#F0F4FF", border: "none", borderRadius: 20,
    width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#8891B4",
  } as React.CSSProperties,
  catBtn: {
    fontSize: 11, fontWeight: 700, padding: "5px 10px",
    borderRadius: 20, cursor: "pointer",
  } as React.CSSProperties,
  chipBtn: {
    fontSize: 12, fontWeight: 700, padding: "6px 12px",
    borderRadius: 20, cursor: "pointer",
  } as React.CSSProperties,
  diffBtn: {
    flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
    textAlign: "center" as const,
  } as React.CSSProperties,
  primaryBtn: {
    width: "100%", padding: "12px", borderRadius: 12, border: "none",
    backgroundColor: "#6C63FF", color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  secondaryBtn: {
    flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #E0E7FF",
    backgroundColor: "#F0F4FF", color: "#2D3A5E", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  dangerBtn: {
    padding: "10px 16px", borderRadius: 10, border: "none",
    backgroundColor: "#FFE3E3", color: "#E03131", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
} as const;
