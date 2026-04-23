// =====================================================================
// NowIndicator.tsx — 「いま」のピン
// =====================================================================
// 紫 (#6C63FF) のノードが脈打つマーカー。赤は使わない (警告感回避)。
// 1 分ごとに位置を再計算する。
// Ribbon 親要素の width% に対して left: ${percent}% で配置する想定。
// =====================================================================

import { useEffect, useState } from "react";
import { TIME_CONFIG } from "../../config/defaults";
import { PURPLE } from "../../config/theme";

function computeSlotFractionAt(date: Date): number | null {
  // 0〜1 の比率。06:00 未満 / 22:00 以降は null (リボン外)。
  const minutes = date.getHours() * 60 + date.getMinutes();
  const startMin = TIME_CONFIG.dayStartSlot * TIME_CONFIG.slotMinutes;
  const endMin = TIME_CONFIG.dayEndSlot * TIME_CONFIG.slotMinutes;
  if (minutes < startMin || minutes >= endMin) return null;
  return (minutes - startMin) / (endMin - startMin);
}

export function NowIndicator() {
  const [fraction, setFraction] = useState<number | null>(() =>
    computeSlotFractionAt(new Date()),
  );

  useEffect(() => {
    const tick = () => setFraction(computeSlotFractionAt(new Date()));
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (fraction === null) return null;

  const leftPercent = fraction * 100;

  return (
    <div
      aria-label="いま"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${leftPercent}%`,
        width: 2,
        background: PURPLE.main,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* ラベル */}
      <div
        style={{
          position: "absolute",
          top: -24,
          left: -20,
          fontSize: 11,
          fontWeight: 700,
          color: PURPLE.main,
          background: "#fff",
          padding: "2px 6px",
          borderRadius: 8,
          boxShadow: "0 1px 4px rgba(108,99,255,.3)",
          whiteSpace: "nowrap",
        }}
      >
        いま
      </div>

      {/* 脈打つドット */}
      <div
        style={{
          position: "absolute",
          left: -7,
          top: "50%",
          transform: "translateY(-50%)",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: PURPLE.main,
          border: "3px solid #fff",
          boxShadow: "0 0 0 2px rgba(108,99,255,.35)",
          animation: "pulse-now 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}
