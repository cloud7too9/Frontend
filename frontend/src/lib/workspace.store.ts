import { writable, get } from "svelte/store";
import type { Container, Tool, Workspace } from "@mainhub/shared";
import { getTools, getWorkspace, putWorkspace } from "./api.js";
import { computeMove, computeResize, findFreeSpot } from "./grid.js";
import { createId } from "./id.js";

export type SaveState = "ungespeichert" | "speichert" | "gespeichert" | "fehler";

export interface WorkspaceState {
  workspace: Workspace | null;
  tools: Tool[];
  editor: boolean;
  selectedContainerId: string | null;
  isLoading: boolean;
  saveState: SaveState;
  errorMessage: string | null;
}

const initial: WorkspaceState = {
  workspace: null,
  tools: [],
  editor: false,
  selectedContainerId: null,
  isLoading: false,
  saveState: "gespeichert",
  errorMessage: null,
};

const state = writable<WorkspaceState>(initial);

function markDirty<S extends WorkspaceState>(s: S): S {
  return { ...s, saveState: "ungespeichert", errorMessage: null };
}

function mutateContainers(fn: (container: Container[], workspace: Workspace) => Container[]): void {
  state.update((s) => {
    if (!s.workspace) return s;
    const next = fn(s.workspace.container, s.workspace);
    if (next === s.workspace.container) return s;
    return markDirty({ ...s, workspace: { ...s.workspace, container: next } });
  });
}

export const workspaceStore = {
  subscribe: state.subscribe,

  async loadInitial(): Promise<void> {
    state.update((s) => ({ ...s, isLoading: true, errorMessage: null }));
    try {
      const [workspace, tools] = await Promise.all([getWorkspace(), getTools()]);
      state.set({
        workspace,
        tools,
        editor: false,
        selectedContainerId: null,
        isLoading: false,
        saveState: "gespeichert",
        errorMessage: null,
      });
    } catch (err) {
      state.update((s) => ({
        ...s,
        isLoading: false,
        saveState: "fehler",
        errorMessage: (err as Error).message,
      }));
    }
  },

  setEditor(on: boolean): void {
    state.update((s) => ({
      ...s,
      editor: on,
      selectedContainerId: on ? s.selectedContainerId : null,
    }));
  },

  toggleEditor(): void {
    state.update((s) => {
      const editor = !s.editor;
      return { ...s, editor, selectedContainerId: editor ? s.selectedContainerId : null };
    });
  },

  selectContainer(id: string): void {
    state.update((s) => {
      if (!s.editor) return s;
      if (!s.workspace?.container.some((c) => c.id === id)) return s;
      return { ...s, selectedContainerId: id };
    });
  },

  clearSelection(): void {
    state.update((s) => (s.selectedContainerId === null ? s : { ...s, selectedContainerId: null }));
  },

  moveContainer(id: string, dxCells: number, dyCells: number): void {
    if (dxCells === 0 && dyCells === 0) return;
    mutateContainers((container, workspace) => {
      const current = container.find((c) => c.id === id);
      if (!current) return container;
      const others = container.filter((c) => c.id !== id);
      const moved = computeMove(current, dxCells, dyCells, workspace.spalten, others);
      if (!moved) return container;
      return container.map((c) => (c.id === id ? moved : c));
    });
  },

  resizeContainer(id: string, dwCells: number, dhCells: number): void {
    if (dwCells === 0 && dhCells === 0) return;
    mutateContainers((container, workspace) => {
      const current = container.find((c) => c.id === id);
      if (!current) return container;
      const others = container.filter((c) => c.id !== id);
      const resized = computeResize(current, dwCells, dhCells, workspace.spalten, others);
      if (!resized) return container;
      return container.map((c) => (c.id === id ? resized : c));
    });
  },

  addContainer(toolId: string): void {
    state.update((s) => {
      if (!s.workspace) return s;
      const breite = 2;
      const hoehe = 2;
      const spot = findFreeSpot(s.workspace.container, s.workspace.spalten, breite, hoehe);
      if (spot.y >= 100) {
        return {
          ...s,
          saveState: "fehler",
          errorMessage: "Kein freier Platz im Grid",
        };
      }
      const neu: Container = {
        id: createId(),
        toolId,
        x: spot.x,
        y: spot.y,
        breite,
        hoehe,
      };
      return markDirty({
        ...s,
        workspace: { ...s.workspace, container: [...s.workspace.container, neu] },
      });
    });
  },

  renameContainer(id: string, titel: string): void {
    const trimmed = titel.trim();
    mutateContainers((container) =>
      container.map((c) => {
        if (c.id !== id) return c;
        if (trimmed === "") {
          const { titel: _ignored, ...rest } = c;
          return rest;
        }
        return { ...c, titel: trimmed };
      })
    );
  },

  changeContainerTool(id: string, toolId: string): void {
    mutateContainers((container) =>
      container.map((c) => (c.id === id && c.toolId !== toolId ? { ...c, toolId } : c))
    );
  },

  removeContainer(id: string): void {
    state.update((s) => {
      if (!s.workspace) return s;
      if (!s.workspace.container.some((c) => c.id === id)) return s;
      const container = s.workspace.container.filter((c) => c.id !== id);
      return markDirty({
        ...s,
        workspace: { ...s.workspace, container },
        selectedContainerId: s.selectedContainerId === id ? null : s.selectedContainerId,
      });
    });
  },

  async saveNow(): Promise<void> {
    const s = get(state);
    if (!s.workspace) return;
    state.update((cur) => ({ ...cur, saveState: "speichert", errorMessage: null }));
    try {
      const saved = await putWorkspace(s.workspace);
      state.update((cur) => ({
        ...cur,
        workspace: saved,
        saveState: "gespeichert",
        errorMessage: null,
      }));
    } catch (err) {
      state.update((cur) => ({
        ...cur,
        saveState: "fehler",
        errorMessage: (err as Error).message,
      }));
    }
  },
};
