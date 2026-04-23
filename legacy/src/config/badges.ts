// バッジ定義。6つの達成トラック（PRD 3.1）に対応する

export interface BadgeDef {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  {
    id: "streak_starter",
    icon: "🔥",
    name: "継続スタート",
    description: "3日連続アプリを開いた",
  },
  {
    id: "focus_star",
    icon: "🎯",
    name: "集中スター",
    description: "1回のタスクで30分以上ずっと集中した",
  },
  {
    id: "challenger",
    icon: "⚡",
    name: "チャレンジャー",
    // チャレンジトラック：「ちょっと難しい」を5回完了で解放
    description: "「ちょっと難しい」タスクを5回やり切った",
  },
  {
    id: "planner",
    icon: "📋",
    name: "計画マスター",
    description: "翌日の時間割を前の日に3回作った",
  },
  {
    id: "grower",
    icon: "📈",
    name: "成長中",
    description: "先週より多くタスクを完了した週があった",
  },
  {
    id: "voice",
    icon: "💡",
    name: "自己表現",
    description: "振り返りコメントを5回書いた",
  },
];

export const BADGE_MAP: Record<string, BadgeDef> =
  Object.fromEntries(BADGES.map(b => [b.id, b]));
