import { useState } from "react";
import { migrateIfNeeded } from "./utils/storage";
import { TimeGrid } from "./components/planner/TimeGrid";
import { TaskFormModal } from "./components/planner/TaskFormModal";
import type { TaskFormData } from "./components/planner/TaskFormModal";
import { useTimeGrid } from "./hooks/useTimeGrid";
import type { Task } from "./types";

migrateIfNeeded();

const TODAY = new Date().toISOString().slice(0, 10);

type ModalState =
  | { type: "add";  slot: number }
  | { type: "edit"; task: Task }
  | null;

export default function App() {
  const { tasks, displayMode, setDisplayMode, addTask, updateTask, completeTask, deleteTask, uncompleteTask } = useTimeGrid(TODAY);
  const [modal, setModal] = useState<ModalState>(null);

  const handleSlotClick = (slot: number) => {
    setModal({ type: "add", slot });
  };

  const handleTaskClick = (task: Task) => {
    setModal({ type: "edit", task });
  };

  const handleTaskDoubleClick = (task: Task) => {
    if (task.status === "done") {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id, task.plannedMinutes);
    }
  };

  const handleSave = (data: TaskFormData) => {
    if (!modal) return;

    if (modal.type === "add") {
      addTask({
        id: crypto.randomUUID(),
        title: data.title,
        categoryId: data.categoryId,
        startSlot: modal.slot,
        durationSlots: data.durationSlots,
        plannedMinutes: data.durationSlots * 15,
        difficulty: data.difficulty,
        status: "planned",
        isLocked: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      updateTask(modal.task.id, {
        title: data.title,
        categoryId: data.categoryId,
        durationSlots: data.durationSlots,
        plannedMinutes: data.durationSlots * 15,
        difficulty: data.difficulty,
      });
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (modal?.type === "edit") {
      deleteTask(modal.task.id);
      setModal(null);
    }
  };

  const handleToggleComplete = () => {
    if (modal?.type === "edit") {
      const task = modal.task;
      if (task.status === "done") {
        uncompleteTask(task.id);
      } else {
        completeTask(task.id, task.plannedMinutes);
      }
      setModal(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#F0F4FF", fontFamily: "-apple-system,'Helvetica Neue',Arial,sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ background: "linear-gradient(135deg,#6C63FF,#a855f7,#FF6B9D)", padding: "14px 20px", flexShrink: 0, color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🌟 できた！くん</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{TODAY}</div>
      </div>
      {/* メインコンテンツ */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "12px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E0E7FF", padding: 14, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TimeGrid
            tasks={tasks}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onSlotClick={handleSlotClick}
            onTaskClick={handleTaskClick}
            onTaskDoubleClick={handleTaskDoubleClick}
          />
        </div>
      </div>

      {modal?.type === "add" && (
        <TaskFormModal
          mode="add"
          startSlot={modal.slot}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "edit" && (
        <TaskFormModal
          mode="edit"
          startSlot={modal.task.startSlot}
          initialData={{
            title:         modal.task.title,
            categoryId:    modal.task.categoryId,
            durationSlots: modal.task.durationSlots,
            difficulty:    modal.task.difficulty,
          }}
          isDone={modal.task.status === "done"}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
