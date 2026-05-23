// =====================================================================
// TaskBlock.tsx — ribbon 上の 1 ブロック (アイコンのみ表示)
// =====================================================================
// 2026-04-23 ユーザー指示の更新: 11 歳の息子さんの実機テストで
// 「文字が多い = やることが多い」というプレッシャーが観察された。
// タスク名を ribbon 上から撤去し、視覚的には「カテゴリアイコン」と
// 「難易度絵文字」だけに絞る。具体的な名前・時刻・メモはタップで
// 開く TaskDetailPopover (同階層) に集約する。
//
// 表示要素 (修訂後):
//   中央 : カテゴリ / タスクのアイコン (大きめ)
//   右上 : 難易度絵文字 (😊😐😅、小さめ)
//   右下 : 完了マーク (done 時のみ)
//   左下 : ロックマーク (isLocked 時のみ)
//
// タスク名を隠すことは「秘密にする」ことではない。一覧性の最適化であり、
// 詳細はいつでも 1 tap で popover から見える。
//
// aria-label にはタスク名・難易度・ロック状態を日本語で含める。
// スクリーンリーダーでも視覚に頼らず内容が伝わるようにする。
// =====================================================================

import { useMemo } from "react";
import type { Category, Task } from "../../store/types";
import { STATUS_COLORS, RADIUS } from "../../config/theme";
import { DIFFICULTY_EMOJI, DIFFICULTY_LABEL } from "../../config/messages";

interface Props {
  task: Task;
  category: Category | undefined;
  onClick: (anchorRect: DOMRect) => void;
}

export function TaskBlock({ task, category, onClick }: Props) {
  const style = useMemo(() => {
    const isDone = task.status === "done";
    const baseColor = category?.color ?? "#CCCCCC";
    const opacity = isDone ? 0.55 : task.status === "paused" ? 0.7 : 1;
    const bg = isDone ? STATUS_COLORS.done : baseColor;
    return { background: bg, opacity };
  }, [task.status, category]);

  const isNow = task.status === "inProgress";

  // 幅が狭いブロックでは難易度絵文字を省略する (2026-04-23 追加):
  //   iPad Pro 11" 横向きで 1 スロット = 約 17.9px、2 スロット = 約 35.9px。
  //   中央アイコン (26px) と右上の難易度絵文字 (11px) が水平方向で
  //   オーバーラップし、窮屈な見た目になる。難易度情報は tap で開く
  //   TaskDetailPopover を開けば見られるので、一覧性を優先して隠す。
  //   ユーザー指示は `=== 2` だったが、1 スロット (15 分タスク、
  //   AddTaskModal の DURATION_PRESETS で作成可能) でも同じ問題が
  //   起きるため `<= 2` に一般化している。
  const isNarrow = task.durationSlots <= 2;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    // ribbon の空きタップ (onEmptyClick) に bubble させない。
    e.stopPropagation();
    onClick(e.currentTarget.getBoundingClientRect());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        `${task.title}、むずかしさ ${DIFFICULTY_LABEL[task.difficulty]}` +
        `${task.status === "done" ? "、できた" : ""}` +
        `${task.isLocked ? "、ロック済み" : ""}`
      }
      style={{
        position: "absolute",
        top: 28,
        bottom: 8,
        left: 2,
        right: 2,
        padding: 0,
        border: "none",
        borderRadius: RADIUS.md,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: isNow
          ? "0 0 0 3px #FFE66D, 0 2px 8px rgba(0,0,0,.1)"
          : "0 1px 4px rgba(0,0,0,.08)",
        transition: "opacity 0.3s ease, box-shadow 0.2s ease",
        ...style,
      }}
    >
      {/* 中央: カテゴリ / タスクアイコン */}
      <div
        style={{
          fontSize: 26,
          lineHeight: 1,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        {task.icon ?? category?.icon ?? "•"}
      </div>

      {/* 右上: 難易度絵文字 — 幅が狭いブロック (<=2 slot) では非表示。
          視認情報は aria-label 側に残してあるのでアクセシビリティは
          維持される。 */}
      {!isNarrow && (
        <div
          style={{
            position: "absolute",
            top: 3,
            right: 4,
            fontSize: 11,
            lineHeight: 1,
            opacity: 0.85,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {DIFFICULTY_EMOJI[task.difficulty]}
        </div>
      )}

      {/* 右下: 完了マーク */}
      {task.status === "done" && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            right: 4,
            fontSize: 12,
            color: "#2E7D5B",
            fontWeight: 800,
            lineHeight: 1,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          ✓
        </div>
      )}

      {/* 左下: ロックマーク */}
      {task.isLocked && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            left: 4,
            fontSize: 11,
            lineHeight: 1,
            color: "#666",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          🔒
        </div>
      )}
    </button>
  );
}
