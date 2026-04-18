import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActivityType = "note" | "task" | "file" | "tool";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  label: string;
  timestamp: number;
}

const MAX_ENTRIES = 20;

interface ActivityState {
  entries: ActivityEntry[];
  log: (entry: { type: ActivityType; label: string }) => void;
  clear: () => void;
}

function nextId(): string {
  return `act-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      entries: [],
      log: ({ type, label }) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const entry: ActivityEntry = {
          id: nextId(),
          type,
          label: trimmed,
          timestamp: Date.now(),
        };
        const next = [entry, ...get().entries].slice(0, MAX_ENTRIES);
        set({ entries: next });
      },
      clear: () => set({ entries: [] }),
    }),
    { name: "mainhub.activity.v1" },
  ),
);
