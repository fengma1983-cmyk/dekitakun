// =====================================================================
// src/config/invitationRules.ts
// =====================================================================
// 誘い発火の判定ロジック (純粋関数の集合)。
//
// なぜ純粋関数で実装するか:
//   - 副作用ゼロ → ユニットテストで節制原則を技術的に検証できる
//     (Architecture 9.6 のテスト戦略)
//   - useInvitation は「いつ呼ぶか」だけを管理する。
//     「何を出すか / 出さないか」の判断は全てここに閉じる。
//   - PRD 3.6.7 の節制原則を技術的に保証する唯一の場所。
//
// 設計の合言葉 (v1.1):
//   「誘いを増やしたいとき、invitationRules.ts だけで済むか？」
//   「この誘いは、節制原則を破っていないか？」
//
// Architecture 9.1 の判定フロー:
//   1. 静黙時間帯 → 出さない
//   2. paused タスクの再開誘い (優先度最高)
//   3. 現在時刻のタスク (prePrompt / onTime / onTimeLate / onTimeRetry)
// =====================================================================

import type {
  Task,
  InvitationHistory,
  InvitationEntry,
  InvitationType,
} from "../store/types";
import { INVITATION_LIMITS, TIME_CONFIG } from "./defaults";

// ---------------------------------------------------------------------
// 判定関数の入出力
// ---------------------------------------------------------------------

export interface InvitationContext {
  now: Date;
  dayTasks: Task[];
  history: InvitationHistory;
}

export interface InvitationDecision {
  shouldShow: boolean;
  type?: InvitationType;
  taskId?: string;
  reason: string;   // デバッグ用: なぜ出すか / 出さないか
}

// =====================================================================
// メイン関数: decideInvitation
// =====================================================================
// 1 分おきに useInvitation から呼ばれる想定。純粋関数なので
// 同じ入力に対して同じ出力を返す。テスト容易。
// =====================================================================

export function decideInvitation(ctx: InvitationContext): InvitationDecision {
  // 1. 静黙時間帯 (朝・夜) を最初に弾く
  if (isSilentTime(ctx.now)) {
    return { shouldShow: false, reason: "silent time" };
  }

  // 2. paused タスクの再開誘い (他より優先)
  //    なぜ優先するか: 本人が「一旦とめる」と意思表示した記憶に
  //    寄り添う方が、次の時刻タスクの機械的な声かけより価値が高い。
  const pausedResume = checkPausedResume(ctx);
  if (pausedResume.shouldShow) return pausedResume;

  // 3. 現在時刻帯のタスク誘い
  const current = checkCurrentTaskInvitation(ctx);
  if (current.shouldShow) return current;

  return { shouldShow: false, reason: "no trigger" };
}

// =====================================================================
// isSilentTime — 静黙時間帯判定 (PRD 3.6.7 ⑥)
// =====================================================================
// 朝: INVITATION_LIMITS.silentMorningUntil まで (デフォルト "07:00")
//     目覚めた直後に声をかけるのは侵入的。子どもが自分で開くのを待つ。
// 夜: INVITATION_LIMITS.silentEveningFrom から (デフォルト "21:30")
//     就寝前は静かに終わる。誘いは DayEndScreen に置き換わる。
// =====================================================================

export function isSilentTime(now: Date): boolean {
  const h = now.getHours();
  const m = now.getMinutes();

  const [mh, mm] = INVITATION_LIMITS.silentMorningUntil.split(":").map(Number);
  if (h < mh || (h === mh && m < mm)) return true;

  const [eh, em] = INVITATION_LIMITS.silentEveningFrom.split(":").map(Number);
  if (h > eh || (h === eh && m >= em)) return true;

  return false;
}

// =====================================================================
// isTaskSilenced — 同一タスクへの誘い上限 / 明示的辞退の判定
//                  (PRD 3.6.7 ①②③)
// =====================================================================
// 条件:
//   ① maxPerTaskPerDay (デフォルト 2) を超えたら発火しない
//   ② 「later」または「doneForToday」応答があれば、当日は沈黙
//
// なぜ履歴参照で判定するか:
//   節制の状態はグローバル変数ではなく「その日の履歴」として保存する。
//   テストで時刻を固定しながら、この関数の挙動を検証できる。
// =====================================================================

export function isTaskSilenced(
  taskId: string,
  history: InvitationHistory
): boolean {
  const entries = history.entries.filter((e) => e.taskId === taskId);

  // ① 上限チェック
  if (entries.length >= INVITATION_LIMITS.maxPerTaskPerDay) return true;

  // ② 明示的辞退チェック
  const refused = entries.some(
    (e) => e.response === "later" || e.response === "doneForToday"
  );
  if (refused) return true;

  return false;
}

// =====================================================================
// checkPausedResume — paused タスクの再開誘い判定 (PRD 3.6.6)
// =====================================================================
// 発火条件:
//   - タスクが paused 状態
//   - pausedAt から resumeTimeoutHours (デフォルト 3 時間) 以内
//   - このタスクへの resumePaused 誘いが未実施 (各 paused タスクに 1 回のみ)
//   - このタスクへの通常の誘い上限にも抵触していない
// =====================================================================

export function checkPausedResume(ctx: InvitationContext): InvitationDecision {
  const pausedTasks = ctx.dayTasks.filter(
    (t) => t.status === "paused" && t.pausedAt
  );
  if (pausedTasks.length === 0) {
    return { shouldShow: false, reason: "no paused tasks" };
  }

  for (const t of pausedTasks) {
    // 既に再開誘いを出したか (1 回のみの原則 / PRD 3.6.7 ④)
    const alreadyInvited = ctx.history.entries.some(
      (e) => e.taskId === t.id && e.type === "resumePaused"
    );
    if (alreadyInvited) continue;

    // 記憶の時効 (3 時間)
    const pausedAt = new Date(t.pausedAt!);
    const hoursPassed =
      (ctx.now.getTime() - pausedAt.getTime()) / (1000 * 60 * 60);
    if (hoursPassed > INVITATION_LIMITS.resumeTimeoutHours) continue;

    // 本人が明示的に辞退していないか
    if (isTaskSilenced(t.id, ctx.history)) continue;

    return {
      shouldShow: true,
      type: "resumePaused",
      taskId: t.id,
      reason: `paused task ${t.id} within resume window`,
    };
  }

  return { shouldShow: false, reason: "no eligible paused task" };
}

// =====================================================================
// checkCurrentTaskInvitation — 現在時刻帯のタスクへの誘い判定
// =====================================================================
// PRD 3.6.2 / 3.6.3 / 9.2 に基づく:
//   a. 開始時刻の 5 分前        → prePrompt (履歴ゼロの時のみ)
//   b. 開始時刻 〜 5 分以内       → onTime
//   c. 開始時刻 +5〜30 分         → onTimeLate
//   d. snooze5 応答の 5 分後     → onTimeRetry
//
// 複数タスクが同時にトリガー条件を満たす場合、最も近い開始時刻の
// 1 件のみを採用する (PRD 3.6.7 ⑤)。
// =====================================================================

export function checkCurrentTaskInvitation(
  ctx: InvitationContext
): InvitationDecision {
  const nowMin = ctx.now.getHours() * 60 + ctx.now.getMinutes();

  // planned のみが声かけ対象 (inProgress / done / paused / postponed / carried は除外)
  const plannedTasks = ctx.dayTasks
    .filter((t) => t.status === "planned")
    .sort((a, b) => a.startSlot - b.startSlot);

  for (const t of plannedTasks) {
    if (isTaskSilenced(t.id, ctx.history)) continue;

    // タスク開始の絶対分 (00:00 起点)
    //   startSlot=0 が 06:00、1 スロット = 15 分 (defaults.ts)
    const taskStartMin =
      (TIME_CONFIG.dayStartSlot + t.startSlot) * TIME_CONFIG.slotMinutes;
    const diff = nowMin - taskStartMin;   // 正: 過ぎた分 / 負: まだ未来

    const historyForThis = ctx.history.entries.filter(
      (e) => e.taskId === t.id
    );

    // d. snooze5 応答から 5 分経過したら retry を最優先で検討
    const lastSnooze = historyForThis
      .filter((e) => e.response === "snooze5" && e.respondedAt)
      .sort((a, b) => b.respondedAt!.localeCompare(a.respondedAt!))[0];

    if (lastSnooze?.respondedAt) {
      const minSinceSnooze =
        (ctx.now.getTime() - new Date(lastSnooze.respondedAt).getTime()) /
        (1000 * 60);
      if (minSinceSnooze >= INVITATION_LIMITS.snoozeDurationMinutes) {
        return {
          shouldShow: true,
          type: "onTimeRetry",
          taskId: t.id,
          reason: `retry after snooze5 for task ${t.id}`,
        };
      }
      // snooze 継続中。このタスクは静黙。
      continue;
    }

    // a. 開始 5 分前の軟提醒 (履歴がゼロの時だけ)
    if (
      diff <= 0 &&
      diff >= -INVITATION_LIMITS.prePromptBeforeMinutes &&
      historyForThis.length === 0
    ) {
      return {
        shouldShow: true,
        type: "prePrompt",
        taskId: t.id,
        reason: `5min before task ${t.id}`,
      };
    }

    // b. 開始時刻到達 〜 snoozeDuration 以内
    if (diff >= 0 && diff < INVITATION_LIMITS.snoozeDurationMinutes) {
      const hasOnTimeShown = historyForThis.some(
        (e) =>
          e.type === "onTime" ||
          e.type === "onTimeLate" ||
          e.type === "onTimeRetry"
      );
      if (!hasOnTimeShown) {
        return {
          shouldShow: true,
          type: "onTime",
          taskId: t.id,
          reason: `on time for task ${t.id}`,
        };
      }
    }

    // c. 開始時刻 +5〜30 分
    if (
      diff >= INVITATION_LIMITS.snoozeDurationMinutes &&
      diff <= INVITATION_LIMITS.onTimeLateWindowMinutes
    ) {
      const hasOnTimeShown = historyForThis.some(
        (e) =>
          e.type === "onTime" ||
          e.type === "onTimeLate" ||
          e.type === "onTimeRetry"
      );
      if (!hasOnTimeShown) {
        return {
          shouldShow: true,
          type: "onTimeLate",
          taskId: t.id,
          reason: `within late window for task ${t.id}`,
        };
      }
    }

    // diff > onTimeLateWindowMinutes のタスクは声かけ対象外
    // (carried へ自動遷移する責任は別層 / Architecture 9.3)
  }

  return { shouldShow: false, reason: "no current-time trigger" };
}

// =====================================================================
// recordShown — 誘いを表示した瞬間の履歴エントリを生成 (純粋関数)
// =====================================================================
// useInvitation から「表示した直後」に呼ばれる想定。
// response は、ユーザー応答または自動消滅の検出時に別ヘルパーで追記する。
// =====================================================================

export function recordShown(
  taskId: string,
  type: InvitationType,
  now: Date
): InvitationEntry {
  return {
    taskId,
    type,
    shownAt: now.toISOString(),
  };
}
