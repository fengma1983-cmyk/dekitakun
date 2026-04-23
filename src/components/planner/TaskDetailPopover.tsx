// =====================================================================
// TaskDetailPopover.tsx — TaskBlock タップ時の詳細ポップオーバー
// =====================================================================
// ribbon 上の TaskBlock はアイコンのみ表示に切り替えた (2026-04-23
// ユーザー指示の更新 / 詳細は docs/devlog.md 同日付エントリ)。
// タスク名・時刻・難易度・メモといった「詳細」情報は、タップで開く
// このポップオーバーで見る。
//
// 設計:
//   - 位置: タップされたブロックの上方に浮かぶ。上が狭い時は下へ
//     反転。横は viewport 内にクランプ。
//   - 閉じる: 透明な全画面 backdrop をタップ。
//   - アクション: 完了 (primary) / 編集 (secondary) / 消す (弱め)。
//     inProgress 状態のタスクでは「一旦とめる」「後にまわす」が
//     grayed out で現れる (Phase 2 で本実装、今は「もうすぐ」ラベル)。
//   - ロック済タスクは情報表示のみ。アクションは出さない。
// =====================================================================

import { useMemo } from "react";
import type { Category, Task } from "../../store/types";
import { TIME_CONFIG } from "../../config/defaults";
import { BRAND, PURPLE, RADIUS, SPACING } from "../../config/theme";
import { DIFFICULTY_EMOJI, DIFFICULTY_LABEL } from "../../config/messages";

interface Props {
  task: Task;
  category: Category | undefined;
  anchorRect: DOMRect;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

const POPOVER_WIDTH = 280;
const POPOVER_EST_HEIGHT = 300;   // 上下どちらに置くかの判定に使う概算
const GAP = 12;
const SCREEN_MARGIN = 8;

function slotToHHMM(slot: number): string {
  const totalMin = (TIME_CONFIG.dayStartSlot + slot) * TIME_CONFIG.slotMinutes;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TaskDetailPopover({
  task,
  category,
  anchorRect,
  onClose,
  onEdit,
  onComplete,
  onDelete,
}: Props) {
  const startHHMM = slotToHHMM(task.startSlot);
  const endHHMM   = slotToHHMM(task.startSlot + task.durationSlots);
  const isDone    = task.status === "done";
  const isLocked  = task.isLocked;
  const isNow     = task.status === "inProgress";

  const position = useMemo((): React.CSSProperties => {
    const centerX = anchorRect.left + anchorRect.width / 2;
    let left = centerX - POPOVER_WIDTH / 2;
    left = Math.max(
      SCREEN_MARGIN,
      Math.min(left, window.innerWidth - POPOVER_WIDTH - SCREEN_MARGIN),
    );

    // 上に POPOVER_EST_HEIGHT + GAP の余地がなければ下に反転。
    const placeBelow = anchorRect.top < POPOVER_EST_HEIGHT + GAP;
    return placeBelow
      ? { left, top: anchorRect.bottom + GAP }
      : { left, bottom: window.innerHeight - anchorRect.top + GAP };
  }, [anchorRect]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "transparent",
      }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-label={`${task.title} のくわしく`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          width: POPOVER_WIDTH,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: RADIUS.md,
          boxShadow: "0 12px 32px rgba(0,0,0,.18)",
          padding: SPACING.md,
          animation: "fadeIn .15s ease-out",
          ...position,
        }}
      >
        {/* ヘッダー: カテゴリアイコン + タスク名 + 難易度絵文字 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: SPACING.sm,
            marginBottom: SPACING.sm,
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
            {task.icon ?? category?.icon ?? "•"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: BRAND.textMain,
                wordBreak: "break-word",
                lineHeight: 1.3,
              }}
            >
              {task.title}
            </div>
            {category?.name && (
              <div
                style={{
                  fontSize: 12,
                  color: BRAND.textSub,
                  marginTop: 2,
                  fontWeight: 700,
                }}
              >
                {category.name}
              </div>
            )}
          </div>
          <div style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
            {DIFFICULTY_EMOJI[task.difficulty]}
          </div>
        </div>

        {/* メタ情報 */}
        <div
          style={{
            fontSize: 13,
            color: BRAND.textMain,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: SPACING.md,
            padding: SPACING.sm,
            background: "#FAFAFB",
            borderRadius: RADIUS.sm,
          }}
        >
          <div>🕐 {startHHMM} 〜 {endHHMM}</div>
          <div>むずかしさ： {DIFFICULTY_LABEL[task.difficulty]}</div>
          {task.note && <div>📝 {task.note}</div>}
          {isDone && <div>✓ できた</div>}
          {isLocked && <div>🔒 おとなが ロックした タスク</div>}
        </div>

        {/* アクション — ロック時は一切出さない */}
        {!isLocked && (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
            {!isDone && (
              <button type="button" onClick={onComplete} style={primaryBtn}>
                ✓ 完了
              </button>
            )}
            <div style={{ display: "flex", gap: SPACING.sm }}>
              <button type="button" onClick={onEdit} style={{ ...secondaryBtn, flex: 1 }}>
                ✏️ 編集
              </button>
              <button type="button" onClick={onDelete} style={{ ...tertiaryBtn, flex: 1 }}>
                🗑 消す
              </button>
            </div>
          </div>
        )}

        {/* Phase 2 予定のアクション — now 状態のタスクでのみ表示。
            TabBar の「(もうすぐ)」と同じ思想で「これから来る」ことを
            可視化する。Phase 1-α 時点ではタスクが inProgress になる
            導線がないため、実機ではまず出ないが、将来の連動を
            意識した設計として残す。 */}
        {isNow && !isLocked && (
          <div
            style={{
              marginTop: SPACING.md,
              paddingTop: SPACING.sm,
              borderTop: "1px solid #F0F0F0",
            }}
          >
            <FutureRow icon="⏸" label="一旦とめる" />
            <FutureRow icon="➡" label="後にまわす" />
          </div>
        )}
      </div>
    </div>
  );
}

function FutureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING.sm,
        padding: "8px 4px",
        color: "#B5B5B5",
        fontSize: 13,
        fontWeight: 700,
        cursor: "not-allowed",
      }}
      aria-disabled
    >
      <span style={{ opacity: 0.6 }}>{icon}</span>
      <span>{label}</span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 10,
          color: "#B5B5B5",
          fontWeight: 600,
        }}
      >
        (Phase 2 で追加予定)
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// ボタンスタイル
// 「消す」の視覚強度について:
//   PRD/Architecture では「赤系・警告色は使わない」方針 (theme.ts:45
//   コメント参照)。一方で消去は誤タップ防止のため「編集より弱く」
//   見せたい。そこで border/text を薄くして視覚重量を落とし、
//   色相は付けない (中立グレー) ことで両立する。
// ---------------------------------------------------------------------

const primaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  border: "none",
  background: PURPLE.main,
  color: "#fff",
  borderRadius: RADIUS.md,
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(108,99,255,.3)",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  border: "2px solid #E0E7FF",
  background: "#fff",
  color: BRAND.textMain,
  borderRadius: RADIUS.md,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const tertiaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  border: "2px solid #F3F4F6",
  background: "#fff",
  color: "#9A9AA8",
  borderRadius: RADIUS.md,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
