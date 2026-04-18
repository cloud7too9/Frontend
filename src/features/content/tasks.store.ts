import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useActivityStore } from "./activity.store";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

interface TasksState {
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
}

function nextId(): string {
  return `task-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const task: Task = {
          id: nextId(),
          text: trimmed,
          done: false,
          createdAt: Date.now(),
        };
        set({ tasks: [...get().tasks, task] });
        useActivityStore.getState().log({ type: "task", label: `Aufgabe: ${trimmed}` });
      },
      toggleTask: (id) => {
        const tasks = get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
        set({ tasks });
        const toggled = tasks.find((t) => t.id === id);
        if (toggled) {
          useActivityStore
            .getState()
            .log({
              type: "task",
              label: `${toggled.done ? "Erledigt" : "Wieder offen"}: ${toggled.text}`,
            });
        }
      },
      removeTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },
    }),
    { name: "mainhub.tasks.v1" },
  ),
);
