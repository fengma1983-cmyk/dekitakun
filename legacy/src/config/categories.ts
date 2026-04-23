// 科目・カテゴリ定義。色の追加・変更はこのファイルのみ編集する

export interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  color: string;      // hex（#なし、例："4DABF7"）
  isLocked: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "school",   label: "学校",        icon: "🏫", color: "4DABF7", isLocked: true  },
  { id: "juku",     label: "塾",          icon: "📚", color: "F783AC", isLocked: false },
  { id: "tutor",    label: "補習（1対1）", icon: "👤", color: "CC5DE8", isLocked: false },
  { id: "homework", label: "宿題",        icon: "✏️", color: "51CF66", isLocked: false },
  { id: "study",    label: "自習",        icon: "🔍", color: "FFA94D", isLocked: false },
  { id: "play",     label: "遊び",        icon: "🎮", color: "FF6B6B", isLocked: false },
  { id: "meal",     label: "食事",        icon: "🍚", color: "94D82D", isLocked: false },
  { id: "sleep",    label: "睡眠",        icon: "😴", color: "748FFC", isLocked: true  },
  { id: "free",     label: "自由時間",    icon: "⬜", color: "ADB5BD", isLocked: false },
];

export const CATEGORY_MAP: Record<string, CategoryDef> =
  Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
