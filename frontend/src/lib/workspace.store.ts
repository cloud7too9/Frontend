import { writable, get } from "svelte/store";
import type { Container, Tool, Workspace } from "@mainhub/shared";
import { getTools, getWorkspace, putWorkspace } from "./api.js";
import { clampPosition, clampSize, findFreeSpot } from "./grid.js";
import { createId } from "./id.js";

export interface WorkspaceState {
  workspace: Workspace | null;
  tools: Tool[];
  editor: boolean;
  status: "idle" | "loading" | "saving" | "dirty" | "saved" | "error";
  message: string;
}

const initial: WorkspaceState = {
  workspace: null,
  tools: [],
  editor: false,
  status: "idle",
  message: "",
};

const state = writable<WorkspaceState>(initial);

function update(partial: Partial<WorkspaceState>) {
  state.update((s) => ({ ...s, ...partial }));
}

function mutateWorkspace(fn: (w: Workspace) => Workspace) {
  state.update((s) => {
    if (!s.workspace) return s;
    return { ...s, workspace: fn(s.workspace), status: "dirty", message: "" };
  });
}

export const workspaceStore = {
  subscribe: state.subscribe,

  async loadInitial(): Promise<void> {
    update({ status: "loading", message: "" });
    try {
      const [workspace, tools] = await Promise.all([getWorkspace(), getTools()]);
      state.set({
        workspace,
        tools,
        editor: false,
        status: "idle",
        message: "",
      });
    } catch (err) {
      update({ status: "error", message: (err as Error).message });
    }
  },

  setEditor(on: boolean): void {
    update({ editor: on });
  },

  toggleEditor(): void {
    state.update((s) => ({ ...s, editor: !s.editor }));
  },

  moveContainer(id: string, dxCells: number, dyCells: number): void {
    if (dxCells === 0 && dyCells === 0) return;
    mutateWorkspace((w) => ({
      ...w,
      container: w.container.map((c) =>
        c.id === id
          ? clampPosition({ ...c, x: c.x + dxCells, y: c.y + dyCells }, w.spalten)
          : c
      ),
    }));
  },

  resizeContainer(id: string, dwCells: number, dhCells: number): void {
    if (dwCells === 0 && dhCells === 0) return;
    mutateWorkspace((w) => ({
      ...w,
      container: w.container.map((c) =>
        c.id === id
          ? clampSize({ ...c, breite: c.breite + dwCells, hoehe: c.hoehe + dhCells }, w.spalten)
          : c
      ),
    }));
  },

  addContainer(toolId: string): void {
    mutateWorkspace((w) => {
      const breite = 2;
      const hoehe = 2;
      const spot = findFreeSpot(w.container, w.spalten, breite, hoehe);
      const neu: Container = {
        id: createId(),
        toolId,
        x: spot.x,
        y: spot.y,
        breite,
        hoehe,
      };
      return { ...w, container: [...w.container, neu] };
    });
  },

  async saveNow(): Promise<void> {
    const s = get(state);
    if (!s.workspace) return;
    update({ status: "saving", message: "" });
    try {
      const saved = await putWorkspace(s.workspace);
      state.update((cur) => ({
        ...cur,
        workspace: saved,
        status: "saved",
        message: "Gespeichert",
      }));
    } catch (err) {
      update({ status: "error", message: (err as Error).message });
    }
  },
};
