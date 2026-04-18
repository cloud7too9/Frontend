import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useActivityStore } from "./activity.store";

interface NotesState {
  text: string;
  setText: (text: string) => void;
}

let logTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      text: "",
      setText: (text) => {
        set({ text });
        if (logTimer) clearTimeout(logTimer);
        logTimer = setTimeout(() => {
          const preview = text.trim().slice(0, 40);
          useActivityStore
            .getState()
            .log({ type: "note", label: preview ? `Notiz: ${preview}` : "Notiz geleert" });
        }, 800);
      },
    }),
    { name: "mainhub.notes.v1" },
  ),
);
