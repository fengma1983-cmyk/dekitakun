// =====================================================================
// BandLabels.tsx — ribbon の下に表示する 4 帯のラベル行 (バッチ B)
// =====================================================================
// なぜ ribbon の中ではなく外に出すか:
//   2 slot タスクのアイコンと帯ラベルが上隅で空間衝突する症状を解消。
//
// なぜ ribbon の上ではなく下に置くか (ユーザー判断):
//   - NowIndicator が ribbon の上方向に伸びるので上はラベルと競合する
//   - 11 歳の自然な目線フロー: ribbon → 参照ラベル → 統計サマリー
//   - 地下鉄路線図の慣習 (線路の下に駅名)
//
// なぜ「狭い帯」だけアイコンのみフォールバックか:
//   "あさ" (8 slots ≈ 12.5% ≈ 149px @ 1194 横) のような狭い帯では
//   絵文字とテキストを併記すると詰まる。アイコンだけなら正方形に
//   収まる。テキストは aria-label に保持してスクリーンリーダーには
//   伝える (defaults.ts BAND_NARROW_SLOT_THRESHOLD 参照)。
//
// font-weight 500 / letterSpacing 0.3 / color = textSub:
//   ribbon 外置きで背景が中立色になるため、現行の 700 / 1 では
//   帯名が必要以上に強く主張する。「補助的な参照情報」の温度に
//   揃えるための弱め設定。
// =====================================================================

import {
  BAND_NARROW_SLOT_THRESHOLD,
  DAY_BANDS,
  TIME_CONFIG,
} from "../../config/defaults";
import { BRAND, SPACING } from "../../config/theme";

export function BandLabels() {
  const total = TIME_CONFIG.totalSlots;

  return (
    <div
      aria-label="一日の 4 帯"
      style={{
        position: "relative",
        width: "100%",
        height: 28,
        marginTop: SPACING.xs,
      }}
    >
      {DAY_BANDS.map((band) => {
        const slots = band.endSlot - band.startSlot;
        const leftPercent = (band.startSlot / total) * 100;
        const widthPercent = (slots / total) * 100;
        const narrow = slots < BAND_NARROW_SLOT_THRESHOLD;

        return (
          <div
            key={band.id}
            aria-label={band.label}
            style={{
              position: "absolute",
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.3,
              color: BRAND.textSub,
              // 帯間の境界が見えやすいよう、隣接ラベル同士の余白として
              // 内側に padding を取る (絶対配置のため margin は効かない)。
              padding: "0 4px",
              boxSizing: "border-box",
            }}
          >
            <span aria-hidden style={{ fontSize: 14 }}>
              {band.icon}
            </span>
            {!narrow && <span>{band.label}</span>}
          </div>
        );
      })}
    </div>
  );
}
