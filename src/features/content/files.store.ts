import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useActivityStore } from "./activity.store";

export interface FileEntry {
  id: string;
  name: string;
  url?: string;
  addedAt: number;
}

interface FilesState {
  files: FileEntry[];
  addFile: (name: string, url?: string) => void;
  removeFile: (id: string) => void;
}

function nextId(): string {
  return `file-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (name, url) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const trimmedUrl = url?.trim() || undefined;
        const entry: FileEntry = {
          id: nextId(),
          name: trimmedName,
          url: trimmedUrl,
          addedAt: Date.now(),
        };
        set({ files: [...get().files, entry] });
        useActivityStore.getState().log({ type: "file", label: `Datei: ${trimmedName}` });
      },
      removeFile: (id) => {
        set({ files: get().files.filter((f) => f.id !== id) });
      },
    }),
    { name: "mainhub.files.v1" },
  ),
);
