// 積分規則。数値の変更はこのファイルのみ編集する

export const POINTS = {
  easy:      1,  // かんたん
  normal:    2,  // ふつう
  challenge: 4,  // ちょっと難しい

  planAhead:     2,  // 翌日の時間割を事前に作成
  reviewWritten: 1,  // 振り返りコメントを書いた

  streakBonus: {
    7:  3,
    14: 5,
    30: 10,
  } as Record<number, number>,
} as const;
