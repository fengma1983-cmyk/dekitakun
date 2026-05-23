// =====================================================================
// src/App.tsx — エントリ
// =====================================================================
// Phase 1-α のエントリ。以下の要素だけを持つ:
//   - AppProvider (Context + hydration + 初回 seed)
//   - KidHeader (ブランドバー + 今日の日付)
//   - TabBar (じかんわり タブのみ active、他はまだ何もしない)
//   - DayRibbon (中央)
//   - AddTaskModal (タスクタップ / 空き枠タップで開く)
//   - CelebrationEffect (完了時のオーバーレイ)
// =====================================================================

import { useState } from "react";
import { AppProvider, useAppContext } from "./store/AppContext";
import { usePlanner } from "./hooks/usePlanner";
import { DayRibbon } from "./components/planner/DayRibbon";
import { BandLabels } from "./components/planner/BandLabels";
import { AddTaskModal } from "./components/planner/AddTaskModal";
import { CelebrationEffect } from "./components/planner/CelebrationEffect";
import { TaskDetailPopover } from "./components/planner/TaskDetailPopover";
import { BRAND, PURPLE, RADIUS, SPACING } from "./config/theme";
import type { Task } from "./store/types";

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

// =====================================================================
// AppShell — Provider 配下の主画面
// =====================================================================

function AppShell() {
  const { state } = useAppContext();
  const { addTask, updateTask, deleteTask, completeTask, clearCelebration } =
    usePlanner();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [approxStart, setApproxStart] = useState<number | undefined>(undefined);

  // タスクタップで開く詳細ポップオーバー。
  // タスク本体 (ID ではなく Task オブジェクト) を保持することで、
  // popover 表示中に state 側の tasks が更新されても popover 内の
  // 表示は「タップ時点のスナップショット」を維持し、チラつきを避ける。
  // anchorRect は TaskBlock の画面上の矩形で popover 位置決めに使う。
  const [popoverTask, setPopoverTask] = useState<Task | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  // hydration が終わっていない間は軽いローディング
  if (!state.dayPlan) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: 36 }}>🌤️</div>
        <div style={{ fontSize: 14, color: BRAND.textSub, marginTop: 8 }}>
          じゅんびちゅう…
        </div>
      </div>
    );
  }

  const celebrating = state.celebratingTaskId
    ? state.dayPlan.tasks.find((t) => t.id === state.celebratingTaskId)
    : null;

  const openNewTaskAt = (slot: number) => {
    setEditingTask(undefined);
    setApproxStart(slot);
    setModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setApproxStart(undefined);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(undefined);
  };

  const openPopover = (task: Task, rect: DOMRect) => {
    setPopoverTask(task);
    setPopoverAnchor(rect);
  };

  const closePopover = () => {
    setPopoverTask(null);
    setPopoverAnchor(null);
  };

  const popoverCategory = popoverTask
    ? state.categories.find((c) => c.id === popoverTask.categoryId)
    : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: BRAND.background,
      }}
    >
      <KidHeader date={state.currentDate} points={state.achievement.totalPoints} />
      <TabBar />

      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: SPACING.lg,
          display: "flex",
          flexDirection: "column",
          gap: SPACING.md,
        }}
      >
        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: SPACING.md,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: BRAND.textMain,
            }}
          >
            きょうの じかんわり
          </h1>
          <button
            type="button"
            onClick={() => openNewTaskAt(nextFreeSlot(state.dayPlan?.tasks ?? []))}
            style={{
              padding: "10px 18px",
              border: "none",
              background: PURPLE.main,
              color: "#fff",
              borderRadius: RADIUS.pill,
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(108,99,255,.3)",
            }}
          >
            ＋ ついか
          </button>
        </section>

        <DayRibbon
          tasks={state.dayPlan.tasks}
          categories={state.categories}
          onTaskClick={openPopover}
          onEmptyClick={openNewTaskAt}
        />

        {/* バッチ B: 帯ラベル外置 (ribbon 直下)。
            NowIndicator が ribbon 上方向に伸びるので下が視覚競合しない。 */}
        <BandLabels />

        {/* 息子に「今どんな感じ？」のミニサマリー (分母なし) */}
        <TodaySummary tasks={state.dayPlan.tasks} />
      </main>

      <AddTaskModal
        open={modalOpen}
        existingTask={editingTask}
        approxStartSlot={approxStart}
        categories={state.categories}
        subjects={state.subjects}
        existingTasks={state.dayPlan.tasks}
        onClose={closeModal}
        onSave={(input) => {
          if (editingTask) {
            updateTask(editingTask.id, {
              title: input.title,
              icon: input.icon,
              categoryId: input.categoryId,
              subjectId: input.subjectId,
              startSlot: input.startSlot,
              durationSlots: input.durationSlots,
              plannedMinutes: input.durationSlots * 15,
              difficulty: input.difficulty,
            });
          } else {
            addTask(input);
          }
          closeModal();
        }}
        onComplete={(id) => completeTask(id)}
        onDelete={(id) => {
          deleteTask(id);
          closeModal();
        }}
      />

      {popoverTask && popoverAnchor && (
        <TaskDetailPopover
          task={popoverTask}
          category={popoverCategory}
          anchorRect={popoverAnchor}
          onClose={closePopover}
          onEdit={() => {
            const t = popoverTask;
            closePopover();
            openEditTask(t);
          }}
          onComplete={() => {
            completeTask(popoverTask.id);
            closePopover();
          }}
          onDelete={() => {
            deleteTask(popoverTask.id);
            closePopover();
          }}
        />
      )}

      {celebrating && (
        <CelebrationEffect
          difficulty={celebrating.difficulty}
          onDismiss={clearCelebration}
        />
      )}
    </div>
  );
}

// =====================================================================
// KidHeader — ブランドバー
// =====================================================================
// 紫のグラデ。「じかんわり」タイトル + 日付 + ポイント。
// 文言はシンプルに。評価軸 (3/10 等) は出さない。
// =====================================================================

function KidHeader({ date, points }: { date: string; points: number }) {
  const today = new Date(date);
  const dayNames = ["にち", "げつ", "か", "すい", "もく", "きん", "ど"];
  const dateLabel = `${today.getMonth() + 1}がつ ${today.getDate()}にち (${dayNames[today.getDay()]}ようび)`;

  return (
    <header
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        background: `linear-gradient(135deg, ${PURPLE.main}, #A855F7, #FF6B9D)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: SPACING.md,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
        <span style={{ fontSize: 24 }}>🌟</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>できた！くん</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{dateLabel}</div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,.22)",
          padding: "6px 14px",
          borderRadius: RADIUS.pill,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        ⭐ {points} ポイント
      </div>
    </header>
  );
}

// =====================================================================
// TabBar — 今は「じかんわり」だけ active、他は placeholder
// =====================================================================

function TabBar() {
  const tabs = [
    { id: "planner",  label: "じかんわり", active: true },
    { id: "record",   label: "きろく",     active: false },
    { id: "achieve",  label: "たっせい",   active: false },
    { id: "points",   label: "ポイント",   active: false },
  ];
  return (
    <nav
      style={{
        display: "flex",
        background: "#fff",
        borderBottom: "2px solid #E0E7FF",
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={!t.active}
          style={{
            padding: "14px 24px",
            border: "none",
            background: t.active ? "#F5F3FF" : "transparent",
            borderBottom: t.active ? `3px solid ${PURPLE.main}` : "3px solid transparent",
            color: t.active ? PURPLE.main : "#B5B5B5",
            fontWeight: 700,
            fontSize: 15,
            cursor: t.active ? "default" : "not-allowed",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
          {!t.active && (
            <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>
              (もうすぐ)
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

// =====================================================================
// TodaySummary — 数字表示は「N こ できた」のみ (分母なし)
// =====================================================================

function TodaySummary({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === "done").length;
  const focusMinutes = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.actualMinutes ?? t.plannedMinutes), 0);

  return (
    <div
      style={{
        display: "flex",
        gap: SPACING.md,
        flexWrap: "wrap",
      }}
    >
      <SummaryChip label="できた" value={`${done} こ`} />
      <SummaryChip label="集中" value={`${focusMinutes} ぷん`} />
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: "#fff",
        borderRadius: RADIUS.md,
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        display: "flex",
        alignItems: "center",
        gap: SPACING.sm,
      }}
    >
      <span style={{ fontSize: 12, color: BRAND.textSub, fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, color: BRAND.textMain }}>
        {value}
      </span>
    </div>
  );
}

// =====================================================================
// ヘルパー
// =====================================================================

function nextFreeSlot(tasks: Task[]): number {
  // FIXME(Phase 1-β): 既存タスクの間の空きスロットを無視して
  // 最後尾に追加する簡易実装。午前中に空きがあっても夜末尾
  // に追加される。Phase 1-β で空きスロット探索アルゴリズムに
  // 置き換える。その時のテストケース:
  //   - 既存 [朝ごはん 7:00-7:30, 学校 8:00-14:30] で新タスク
  //     を追加 → 7:30-8:00 の空きが最優先で提案されるべき
  //
  // 既知の UX ヒッカップ (バッチ B 以降): seed が末尾 (slot 64=22:00)
  // まで埋まっている状態で「+ ついか」すると、本関数は
  // Math.min(63, ...) は常に slot 63 を返す。これは末尾 seed-12
  // (21:00-22:00) の中に入るため、AddTaskModal がリアルタイム
  // 重複検出で警告チップを即出する。「+ ついか直後の警告」は
  // 本関数の暫定実装の副作用であって validateTaskTime のバグ
  // ではない。Phase 1-β の空きスロット探索置換時に同時解消。
  if (tasks.length === 0) return 34;
  const sorted = [...tasks].sort((a, b) => a.startSlot - b.startSlot);
  const last = sorted[sorted.length - 1];
  return Math.min(63, last.startSlot + last.durationSlots);
}

const loadingStyle: React.CSSProperties = {
  width: "100%",
  height: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: BRAND.background,
};
