// =====================================================================
// CelebrationEffect.tsx — タスク完了時の祝福演出
// =====================================================================
// 難易度で 3 通りに分岐:
//   easy      → 星 1〜3 個がポップ (StarBurst)
//   normal    → 柔らかい紙吹雪が降る (ConfettiRain)
//   challenge → トロフィー + 金色の光 + 星 + 紙吹雪 同時発動 (TrophyBurst)
//                  2026-04-23 設計方向修正: PRD 7.3 の「柔らかい炎」は
//                  難易度が上がるほど視覚が弱くなる逆転を起こしていたため
//                  撤回 (詳細は docs/devlog.md 同日付エントリ)。
//
// 文言は messages.ts の CELEBRATION_MESSAGES から引く。ハードコード禁止。
//
// 時間構成 (2026-04-23 実機 screenshot を受けての再設計):
//   旧: 視覚効果 (Star/Confetti/Trophy) と称賛メッセージを同時に
//        flex center コンテナに配置 → 中央で物理的に重なり、
//        特に challenge のトロフィーが文字吹き出しに完全に隠された。
//   新: phase 状態で時間的に分離する。
//        0.0s           視覚効果 phase 開始 (文字吹き出しは非表示)
//        1.3s           phase 切り替え (視覚 unmount、文字吹き出し mount)
//        2.8s           onDismiss 発火、全体 unmount
//        各 phase 内の fade in / hold / fade out は CSS keyframe 側
//        (celebration-visual-phase / celebration-message-phase) が担当。
//   総尺は旧 1.8s から 2.8s に 1 秒延びたが、視覚と文字を両方ちゃんと
//   味わえる時間として許容 (実機感覚は fengma さんの判断に委ねる)。
//
// なぜ createPortal で document.body にマウントするか:
//   実機テストで祝福演出が ribbon・ヘッダーに「隠れる」ように見える
//   現象あり。z-index 200 は他の Modal/Popover より大きいが、iOS Safari の
//   backdrop-filter と stacking context の相互作用により、親の stacking
//   context 配下だと順序が不安定になることがある。portal で body 直下に
//   配置すれば親コンテキストの影響を受けず、常に最上層に描画される。
//   z-index も 9999 に引き上げて念のための保険をかける。
//   (実機黄色矩形テストで stacking は OK と確定済み。)
//
// なぜ pointerEvents: "none" か:
//   祝福中もユーザーが背後の要素 (タスクブロック、＋ ついか ボタン)
//   を tap できるようにする。以前は `onClick={onDismiss}` で「どこを
//   tap しても即消える」仕様だったが、誤 tap でせっかくの称賛演出が
//   0.3 秒で消える副作用があった。auto dismiss (2.8 秒) だけに統一し、
//   その間は背景操作を妨げない (通り抜け)。
//
// StarBurst / ConfettiRain を export する理由:
//   TrophyBurst (challenge) が内部で両方とも再利用するため。
//   祝い要素の定義は単一出典をこのファイルに置き、組み合わせ側だけ
//   別ファイルに分ける。
// =====================================================================

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DifficultyLevel } from "../../store/types";
import { getCelebration } from "../../config/messages";
import { RADIUS } from "../../config/theme";
import { TrophyBurst } from "./TrophyBurst";

interface Props {
  difficulty: DifficultyLevel;
  onDismiss: () => void;
}

// -----------------------------------------------------------------
// phase タイムライン (2026-04-23 時間的分離への再設計):
//   0.0s        visual phase 開始 (視覚効果のみ、文字吹き出しは描画しない)
//   1.3s  ← PHASE_SWITCH_MS — setPhase("message")、visual unmount、message mount
//   2.8s  ← TOTAL_DURATION_MS — onDismiss 発火、全体 unmount
//
// 旧設計で視覚効果と文字吹き出しを同じ flex center コンテナに同時配置
// していたため、特に challenge (トロフィー) が中央の文字吹き出しに完全に
// 隠される衝突が実機 screenshot で確認された (stacking ではなくレイアウト
// 衝突)。phase 状態で相互排他的に描画することで物理的に重ならないよう
// にする。各 phase の fade in / hold / fade out は CSS keyframe 側で制御
// (index.css の celebration-visual-phase / celebration-message-phase)。
// -----------------------------------------------------------------
const PHASE_SWITCH_MS    = 1300;
const TOTAL_DURATION_MS  = 2800;

type Phase = "visual" | "message";

export function CelebrationEffect({ difficulty, onDismiss }: Props) {
  const message = useMemo(() => getCelebration(difficulty), [difficulty]);
  const [phase, setPhase] = useState<Phase>("visual");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("message"), PHASE_SWITCH_MS);
    const t2 = setTimeout(onDismiss, TOTAL_DURATION_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 251, 240, 0.85)",
        backdropFilter: "blur(2px)",
        animation: "fadeIn .3s ease-out",
        // 背後の要素を tap 可能にする。祝福は自動 dismiss のみ。
        pointerEvents: "none",
      }}
    >
      {phase === "visual" && (
        <div
          // 視覚効果 phase ラッパ。中の StarBurst / ConfettiRain / TrophyBurst は
          // それぞれ position: absolute inset: 0 で viewport 全体に広がる。
          // 外側の opacity 制御を celebration-visual-phase で行う。
          style={{
            position: "absolute",
            inset: 0,
            animation: "celebration-visual-phase 1.3s ease-in-out both",
          }}
        >
          {difficulty === "easy" && <StarBurst />}
          {difficulty === "normal" && <ConfettiRain />}
          {difficulty === "challenge" && <TrophyBurst />}
        </div>
      )}

      {phase === "message" && (
        <div
          // 称賛メッセージ phase。flex center の子として中央配置。
          // fade in / hold / fade out は celebration-message-phase が担当。
          style={{
            position: "relative",
            padding: "24px 36px",
            background: "#fff",
            borderRadius: RADIUS.lg,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            fontSize: 28,
            fontWeight: 800,
            color: "#3A3A3A",
            textAlign: "center",
            animation: "celebration-message-phase 1.5s ease-in-out both",
          }}
        >
          {message}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------
// 演出バリエーション
// ---------------------------------------------------------------------

export function StarBurst() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden>
      {[-40, 0, 40].map((dx, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "35%",
            left: `calc(50% + ${dx}px)`,
            fontSize: 48,
            animation: `star-pop .6s ease-out ${i * 0.1}s both`,
          }}
        >
          ⭐
        </div>
      ))}
    </div>
  );
}

export function ConfettiRain() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#FFC857", "#FF6B9D", "#6C63FF", "#22C55E", "#4DABF7", "#FB923C"];
  return (
    <div
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
      aria-hidden
    >
      {pieces.map((i) => {
        const left = 10 + ((i * 73) % 80); // 疑似ランダムだが確定的
        const delay = (i % 5) * 0.08;
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: -20,
              left: `${left}%`,
              width: 10,
              height: 14,
              background: color,
              borderRadius: 2,
              animation: `confetti-fall 1.6s ease-in ${delay}s both`,
            }}
          />
        );
      })}
    </div>
  );
}
