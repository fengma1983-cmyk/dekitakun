// =====================================================================
// AddTaskModal.tsx — タスクの追加 / 編集 / 完了 / 削除
// =====================================================================
// なぜ数値入力を使わないか (ユーザー指示):
//   11 歳が数字キーで入力するのは計画の流れを断ち切る。
//   時間 / 分 / 時間長 / 難易度すべてタップ選択。
//
// モード:
//   - 新規: existingTask が undefined。時刻ピッカー初期値は approxStartSlot
//   - 編集: existingTask 指定。完了 / 削除ボタンも出る
// =====================================================================

import { useEffect, useMemo, useState } from "react";
import type { Category, DifficultyLevel, Subject, Task } from "../../store/types";
import { DURATION_PRESETS } from "../../config/defaults";
import { BRAND, PURPLE, RADIUS, SPACING, WARN } from "../../config/theme";
import {
  DIFFICULTY_EMOJI,
  DIFFICULTY_LABEL,
  getConflictMessage,
} from "../../config/messages";
import { hourMinToSlot, slotToHourMin } from "../../utils/timeUtils";
import { validateTaskTime } from "../../utils/taskValidation";

interface Props {
  open: boolean;
  existingTask?: Task;
  approxStartSlot?: number;
  categories: Category[];
  subjects: Subject[];
  // バッチ B 追加: 時刻重複検出用に現タスク群を渡す。
  // 編集モードでは自タスク (existingTask.id) を除外して判定する。
  existingTasks: readonly Task[];
  onClose: () => void;
  onSave: (input: {
    title: string;
    icon?: string;
    categoryId: string;
    subjectId?: string;
    startSlot: number;
    durationSlots: number;
    difficulty: DifficultyLevel;
  }) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const DIFFS: DifficultyLevel[] = ["easy", "normal", "challenge"];
const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);        // 06..21
const MINS = [0, 15, 30, 45];

export function AddTaskModal(props: Props) {
  const { open, existingTask, approxStartSlot, categories, subjects, existingTasks, onClose, onSave, onComplete, onDelete } = props;

  const initialStartSlot = existingTask?.startSlot ?? approxStartSlot ?? 0;
  const initialTime = slotToHourMin(initialStartSlot);

  const [title, setTitle] = useState(existingTask?.title ?? "");
  const [categoryId, setCategoryId] = useState(existingTask?.categoryId ?? categories[0]?.id ?? "homework");
  const [subjectId, setSubjectId] = useState<string | undefined>(existingTask?.subjectId);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [durationMinutes, setDurationMinutes] = useState(existingTask?.plannedMinutes ?? 30);
  // 難易度は敢えてデフォルト未選択にする (PRD 3.4「難易度自己評価」):
  //   "normal" を初期値にすると、子どもは難易度ボタンに触れないまま
  //   全タスクを normal で完了させてしまう。毎回「今日のこれは
  //   むずかしい？ふつう？」を一瞬でも考える習慣を作るため、新規作成時は
  //   難易度未選択 → 「ついか」ボタンが disabled、という導線にする。
  //   編集時は既存値 (DifficultyLevel が 3 値しか取らない型) をそのまま表示する。
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(
    existingTask?.difficulty ?? null,
  );

  // モーダル開閉時に state を同期
  useEffect(() => {
    if (!open) return;
    const t = slotToHourMin(existingTask?.startSlot ?? approxStartSlot ?? 0);
    setTitle(existingTask?.title ?? "");
    setCategoryId(existingTask?.categoryId ?? categories[0]?.id ?? "homework");
    setSubjectId(existingTask?.subjectId);
    setHour(t.hour);
    setMinute(t.minute);
    setDurationMinutes(existingTask?.plannedMinutes ?? 30);
    setDifficulty(existingTask?.difficulty ?? null);
  }, [open, existingTask, approxStartSlot, categories]);

  const relevantSubjects = useMemo(
    () => subjects.filter((s) => s.categoryId === categoryId),
    [subjects, categoryId],
  );

  // バッチ B: リアルタイム時刻重複検出。
  // 入力中の (hour, minute, durationMinutes) が変わるたびに既存タスク群と
  // 突き合わせる。編集モードでは自タスクを除外。
  // useMemo で済ませる理由: O(tasks.length) のループは ~12 件規模で
  // 計測不要なほど軽量、debounce は逆に「打鍵 → 反映」のラグを生む。
  const candidateStartSlot = hourMinToSlot(hour, minute);
  const candidateDurationSlots = Math.max(1, Math.round(durationMinutes / 15));
  const conflict = useMemo(() => {
    const result = validateTaskTime(
      { startSlot: candidateStartSlot, durationSlots: candidateDurationSlots },
      existingTasks,
      existingTask?.id,
    );
    return result.ok ? null : result.conflict;
  }, [candidateStartSlot, candidateDurationSlots, existingTasks, existingTask?.id]);

  if (!open) return null;

  const isEdit = !!existingTask;
  const isLocked = existingTask?.isLocked ?? false;

  const canSave =
    title.trim().length > 0 && difficulty !== null && conflict === null;

  const handleSave = () => {
    if (!canSave || difficulty === null) return;   // difficulty === null は型狭め用
    onSave({
      title: title.trim(),
      icon: existingTask?.icon ?? categories.find((c) => c.id === categoryId)?.icon,
      categoryId,
      subjectId: relevantSubjects.length > 0 ? subjectId : undefined,
      startSlot: hourMinToSlot(hour, minute),
      durationSlots: Math.max(1, Math.round(durationMinutes / 15)),
      difficulty,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,30,50,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: SPACING.lg,
        zIndex: 100,
        animation: "fadeIn .2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          boxShadow: "0 10px 40px rgba(0,0,0,.2)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: BRAND.textMain }}>
          {isEdit ? "タスクを ひらく" : "あたらしい タスク"}
        </h2>

        {isLocked && (
          <div
            style={{
              marginTop: SPACING.sm,
              padding: SPACING.sm,
              background: "#FFF3CD",
              borderRadius: RADIUS.md,
              fontSize: 13,
              color: "#664D03",
            }}
          >
            🔒 おとながロックしたタスク。へんこうは できないよ。
          </div>
        )}

        {/* タスク名 */}
        <Field label="なにをする？">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: さんすうの宿題"
            disabled={isLocked}
            style={inputStyle}
          />
        </Field>

        {/* カテゴリ */}
        <Field label="なんの じかん？">
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.sm }}>
            {categories.map((c) => (
              <ChipButton
                key={c.id}
                active={categoryId === c.id}
                activeColor={c.color}
                onClick={() => {
                  setCategoryId(c.id);
                  setSubjectId(undefined);
                }}
                disabled={isLocked}
              >
                {c.icon} {c.name}
              </ChipButton>
            ))}
          </div>
        </Field>

        {/* 科目 (宿題系のみ) */}
        {relevantSubjects.length > 0 && (
          <Field label="かもく (あれば)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.sm }}>
              <ChipButton
                active={!subjectId}
                onClick={() => setSubjectId(undefined)}
                disabled={isLocked}
              >
                えらばない
              </ChipButton>
              {relevantSubjects.map((s) => (
                <ChipButton
                  key={s.id}
                  active={subjectId === s.id}
                  onClick={() => setSubjectId(s.id)}
                  disabled={isLocked}
                >
                  {s.name}
                </ChipButton>
              ))}
            </div>
          </Field>
        )}

        {/* 開始時刻 */}
        <Field label="なんじから？">
          <div style={{ display: "flex", gap: SPACING.sm, alignItems: "center" }}>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={isLocked}
              style={selectStyle}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h} じ
                </option>
              ))}
            </select>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              disabled={isLocked}
              style={selectStyle}
            >
              {MINS.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "ちょうど" : `${m} ふん`}
                </option>
              ))}
            </select>
          </div>
        </Field>

        {/* 予定時間 */}
        <Field label="どれくらい やる？">
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.sm }}>
            {DURATION_PRESETS.map((p) => (
              <ChipButton
                key={p.minutes}
                active={durationMinutes === p.minutes}
                onClick={() => setDurationMinutes(p.minutes)}
                disabled={isLocked}
              >
                {p.label}
              </ChipButton>
            ))}
          </div>
        </Field>

        {/* 難易度 — 毎回「自己評価」を一瞬考える導線 (PRD 3.4)。
            新規タスクでは未選択スタートにし、選ばないと「ついか」が
            押せない。選択済/未選択の差は border 太さと shadow で強く出す。 */}
        <Field label="どれくらい むずかしい？">
          <div style={{ display: "flex", gap: SPACING.sm }}>
            {DIFFS.map((d) => {
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  disabled={isLocked}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    padding: `${SPACING.md} ${SPACING.sm}`,
                    border: active
                      ? `3px solid ${PURPLE.main}`
                      : "2px solid #E0E7FF",
                    background: active ? PURPLE.light : "#fff",
                    borderRadius: RADIUS.md,
                    fontSize: 28,
                    cursor: isLocked ? "default" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: active
                      ? "0 2px 8px rgba(108,99,255,.25)"
                      : "none",
                    transform: active ? "translateY(-1px)" : "none",
                    transition: "transform .15s ease, box-shadow .15s ease",
                  }}
                >
                  <span>{DIFFICULTY_EMOJI[d]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.textSub }}>
                    {DIFFICULTY_LABEL[d]}
                  </span>
                </button>
              );
            })}
          </div>
          {difficulty === null && !isLocked && (
            <div
              style={{
                marginTop: SPACING.xs,
                fontSize: 12,
                fontWeight: 700,
                color: "#9C6BFF",
              }}
            >
              どれか ひとつ えらんでね
            </div>
          )}
        </Field>

        {/* バッチ B: 時刻重複の警告チップ。
            存在する時のみレンダリング。アクションボタンの直上に置き、
            disable された「ほぞん / ついか」との因果関係を視覚的に
            繋げる (色は theme.WARN 系。赤系は v1.1 哲学で使わない)。
            メッセージ本体は messages.ts の getConflictMessage に集約。 */}
        {conflict && !isLocked && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              background: WARN.soft,
              borderLeft: `4px solid ${WARN.main}`,
              borderRadius: RADIUS.md,
              color: WARN.text,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {getConflictMessage(conflict)}
          </div>
        )}

        {/* アクションボタン */}
        <div style={{ display: "flex", gap: SPACING.sm, marginTop: SPACING.lg, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              border: "2px solid #E0E7FF",
              background: "#fff",
              color: BRAND.textSub,
              borderRadius: RADIUS.md,
              fontWeight: 700,
              minWidth: 100,
            }}
          >
            やめる
          </button>

          {isEdit && onDelete && !isLocked && (
            <button
              type="button"
              onClick={() => existingTask && onDelete(existingTask.id)}
              style={{
                padding: `${SPACING.md} ${SPACING.lg}`,
                border: "2px solid #F3F4F6",
                background: "#fff",
                color: "#8B5CF6",
                borderRadius: RADIUS.md,
                fontWeight: 700,
              }}
            >
              けす
            </button>
          )}

          <div style={{ flex: 1 }} />

          {isEdit && onComplete && !isLocked && existingTask!.status !== "done" && (
            <button
              type="button"
              onClick={() => {
                onComplete(existingTask!.id);
                onClose();
              }}
              style={primaryButtonStyle}
            >
              ✓ できた！
            </button>
          )}

          {!isLocked && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              style={{
                ...primaryButtonStyle,
                opacity: canSave ? 1 : 0.5,
                cursor: canSave ? "pointer" : "not-allowed",
              }}
            >
              {isEdit ? "ほぞん" : "ついか"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 小 UI ヘルパー
// ---------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: SPACING.md }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: BRAND.textSub,
          marginBottom: SPACING.xs,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ChipButton({
  active,
  activeColor,
  disabled,
  children,
  onClick,
}: {
  active?: boolean;
  activeColor?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        border: active ? `2px solid ${activeColor ?? PURPLE.main}` : "2px solid #E0E7FF",
        background: active ? (activeColor ? `${activeColor}40` : PURPLE.light) : "#fff",
        color: BRAND.textMain,
        borderRadius: RADIUS.pill,
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  border: "2px solid #E0E7FF",
  borderRadius: RADIUS.md,
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 16,
  border: "2px solid #E0E7FF",
  borderRadius: RADIUS.md,
  background: "#fff",
  fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  border: "none",
  background: PURPLE.main,
  color: "#fff",
  borderRadius: RADIUS.md,
  fontWeight: 800,
  fontSize: 15,
  boxShadow: "0 2px 8px rgba(108,99,255,.3)",
};
