// カラー・スタイル定数。コンポーネント内でカラーをハードコードしない

export const CATEGORY_COLORS: Record<string, string> = {
  school:   "#4DABF7",
  juku:     "#F783AC",
  tutor:    "#CC5DE8",
  homework: "#51CF66",
  study:    "#FFA94D",
  play:     "#FF6B6B",
  meal:     "#94D82D",
  bath:     "#4DD0E1",
  sleep:    "#748FFC",
  free:     "#ADB5BD",
};

export const APP_COLORS = {
  primary:    "#6C63FF",
  accent:     "#FF6B9D",
  success:    "#22D67A",
  warning:    "#FFD060",
  background: "#F0F4FF",
  surface:    "#FFFFFF",
  textMain:   "#2D3A5E",
  textSub:    "#8891B4",
} as const;
