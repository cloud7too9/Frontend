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

export function normalizeUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return undefined;
  }
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (name, url) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const normalizedUrl = url ? normalizeUrl(url) : undefined;
        const entry: FileEntry = {
          id: nextId(),
          name: trimmedName,
          url: normalizedUrl,
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
