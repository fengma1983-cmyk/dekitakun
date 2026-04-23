// =====================================================================
// TrophyBurst.tsx — challenge 難易度完了時の祝福演出
// =====================================================================
// 2026-04-23 設計方向修正 (詳細は docs/devlog.md 同日付エントリ):
//   PRD 7.3 の「柔らかい炎」は撤回。難易度が上がるほど視覚の祝福が
//   弱くなる (easy 粒子飛散 > normal 賑やか紙吹雪 > challenge 静止の薄炎)
//   という逆転を起こしていたため。challenge は「一番頑張った自分への
//   最大の祝福」になるべきなので、トロフィー + 星 + 紙吹雪の全部盛りに
//   する。
//
// 構成:
//   1. 背景: <StarBurst /> と <ConfettiRain /> を同時発動 (粒子が飛散、
//      紙吹雪が降る)
//   2. 中央: 金色の radial gradient (トロフィーを光らせる backdrop)
//   3. 最前: 🏆 (fontSize 150)
//
// アニメ (trophy-celebrate keyframe、index.css 定義):
//   0.0s → 0.3s  scale 0 → 1.2 (overshoot)
//   0.3s → 0.4s  scale 1.2 → 1.0 (settle)
//   0.4s → 1.3s  ホールド (scale 1.0)
//   合計 1.3 秒。フェードアウトは外側 celebration-visual-phase (親 wrapper) が
//   opacity で統一制御するので、このアニメは scale だけを担当する。
//
// 注: アニメの `transform: scale(...)` は keyframe 側が全値を書き換える
//     ため、中央寄せの `translate(-50%, -50%)` はアニメ適用 div の
//     親に置く (子がアニメ、親が配置)。SoftFlame 時代の反省 (keyframe
//     で transform を丸ごと置換して中央寄せが外れる) を回避する構造。
// =====================================================================

import { StarBurst, ConfettiRain } from "./CelebrationEffect";

export function TrophyBurst() {
  return (
    <div
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      {/* 周囲の祝い要素 — 星の放射 + 紙吹雪の降下 */}
      <StarBurst />
      <ConfettiRain />

      {/* 中央配置の固定コンテナ。アニメする子要素は内側。 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* アニメーションする群 (scale 0 → 1.2 → 1.0 → hold → fade out) */}
        <div
          style={{
            position: "relative",
            width: 300,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "trophy-celebrate 1.3s ease-out both",
          }}
        >
          {/* 金色の radial glow。中央から外へ金 → 透明。 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle, rgba(255, 200, 50, 0.55) 0%, rgba(255, 200, 50, 0) 70%)",
            }}
          />

          {/* トロフィー本体 */}
          <div
            style={{
              position: "relative",
              fontSize: 150,
              lineHeight: 1,
            }}
          >
            🏆
          </div>
        </div>
      </div>
    </div>
  );
}
