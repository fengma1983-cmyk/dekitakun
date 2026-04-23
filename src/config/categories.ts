// =====================================================================
// src/config/categories.ts
// =====================================================================
// カテゴリと科目の初期プリセット。
//
// なぜここに集約するか:
//   Architecture 8.4「カテゴリを追加する → categories.ts のみ編集」。
//   色参照は theme.ts から。色の重複定義禁止。
//
// なぜ「宿題 / 自習」を別カテゴリにするか:
//   PRD 3.6.4 の最小起動メッセージはカテゴリで分岐する。
//   「宿題 → 最初の 1 問だけ」「自習 → 5 分だけタイマー」という違い。
//   categoryId が messages.ts の getMinStartMessage の分岐キーになる。
// =====================================================================

import type { Category, Subject } from "../store/types";
import { CATEGORY_COLORS } from "./theme";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "school",   name: "学校",       icon: "🏫", color: CATEGORY_COLORS.school,   sortOrder: 1 },
  { id: "homework", name: "しゅくだい", icon: "✏️", color: CATEGORY_COLORS.homework, sortOrder: 2 },
  { id: "cram",     name: "塾",         icon: "📚", color: CATEGORY_COLORS.cram,     sortOrder: 3 },
  { id: "study",    name: "じしゅう",   icon: "📖", color: CATEGORY_COLORS.study,    sortOrder: 4 },
  { id: "play",     name: "あそび",     icon: "🎮", color: CATEGORY_COLORS.play,     sortOrder: 5 },
  { id: "meal",     name: "ごはん",     icon: "🍚", color: CATEGORY_COLORS.meal,     sortOrder: 6 },
  { id: "bath",     name: "おふろ",     icon: "🛁", color: CATEGORY_COLORS.bath,     sortOrder: 7 },
  { id: "sleep",    name: "ねる",       icon: "😴", color: CATEGORY_COLORS.sleep,    sortOrder: 8 },
];

// ---------------------------------------------------------------------
// 科目プリセット (宿題カテゴリ配下)
// 息子の実際の科目は card session 後に彼本人が編集する。これは初期値。
// ---------------------------------------------------------------------
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "kokugo", name: "こくご",   categoryId: "homework", sortOrder: 1 },
  { id: "sansuu", name: "さんすう", categoryId: "homework", sortOrder: 2 },
  { id: "rika",   name: "りか",     categoryId: "homework", sortOrder: 3 },
  { id: "shakai", name: "しゃかい", categoryId: "homework", sortOrder: 4 },
  { id: "eigo",   name: "えいご",   categoryId: "homework", sortOrder: 5 },
];
