import { create } from "zustand";
import type { Id } from "../../../shared/types/common.types";
import type { Container, Tool, Workspace } from "./workspace.types";
import { clampContainerToGrid, findFreePosition } from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import { fetchTools, fetchWorkspace, saveWorkspace } from "../api/workspace.api";

export const DEFAULT_WORKSPACE_ID = "default";
export const GRID_GAP = 12;

export type LadeStatus = "idle" | "laedt" | "bereit" | "fehler";

interface WorkspaceState {
  workspace: Workspace | null;
  tools: Tool[];
  editMode: boolean;
  selectedContainerId: Id | null;
  addPanelOpen: boolean;
  ladeStatus: LadeStatus;
  ladeFehler: string | null;
  speicherLaeuft: boolean;

  setEditMode: (value: boolean) => void;
  toggleEditMode: () => void;
  selectContainer: (id: Id | null) => void;
  openAddPanel: () => void;
  closeAddPanel: () => void;

  ladeWorkspace: (id?: string) => Promise<void>;
  speichereWorkspace: () => Promise<void>;

  verschiebeContainer: (id: Id, x: number, y: number) => boolean;
  aendereContainerGroesse: (id: Id, breite: number, hoehe: number) => boolean;
  fuegeContainerHinzu: (toolId: string) => void;
  entferneContainer: (id: Id) => void;
  dupliziereContainer: (id: Id) => void;

  findeTool: (toolId: string) => Tool | undefined;
}

function nextId(prefix: string): Id {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function cloneWorkspace(ws: Workspace): Workspace {
  return { ...ws, container: ws.container.map((c) => ({ ...c })) };
}

function toolMinBreite(tool: Tool | undefined): number {
  return tool?.minBreite ?? 1;
}

function toolMinHoehe(tool: Tool | undefined): number {
  return tool?.minHoehe ?? 1;
}

function toolStandardBreite(tool: Tool | undefined): number {
  return tool?.standardBreite ?? 3;
}

function toolStandardHoehe(tool: Tool | undefined): number {
  return tool?.standardHoehe ?? 2;
}

function toolErlaubtResize(tool: Tool | undefined): boolean {
  return tool?.erlaubtResize ?? true;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  tools: [],
  editMode: false,
  selectedContainerId: null,
  addPanelOpen: false,
  ladeStatus: "idle",
  ladeFehler: null,
  speicherLaeuft: false,

  setEditMode: (value) => {
    set({
      editMode: value,
      selectedContainerId: value ? get().selectedContainerId : null,
    });
  },
  toggleEditMode: () => {
    get().setEditMode(!get().editMode);
  },
  selectContainer: (id) => set({ selectedContainerId: id }),
  openAddPanel: () => set({ addPanelOpen: true }),
  closeAddPanel: () => set({ addPanelOpen: false }),

  ladeWorkspace: async (id = DEFAULT_WORKSPACE_ID) => {
    set({ ladeStatus: "laedt", ladeFehler: null });
    try {
      const [workspace, tools] = await Promise.all([fetchWorkspace(id), fetchTools()]);
      set({ workspace, tools, ladeStatus: "bereit" });
    } catch (err) {
      set({
        ladeStatus: "fehler",
        ladeFehler: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  },

  speichereWorkspace: async () => {
    const { workspace } = get();
    if (!workspace) return;
    set({ speicherLaeuft: true });
    try {
      const saved = await saveWorkspace(workspace);
      set({ workspace: saved });
    } finally {
      set({ speicherLaeuft: false });
    }
  },

  verschiebeContainer: (id, x, y) => {
    const { workspace } = get();
    if (!workspace) return false;
    const target = workspace.container.find((c) => c.id === id);
    if (!target) return false;
    const candidate = clampContainerToGrid({ ...target, x, y }, workspace.spalten);
    if (candidate.x === target.x && candidate.y === target.y) return false;
    if (hasCollision(candidate, workspace.container)) return false;
    const container = workspace.container.map((c) => (c.id === id ? candidate : c));
    set({ workspace: { ...workspace, container } });
    return true;
  },

  aendereContainerGroesse: (id, breite, hoehe) => {
    const { workspace, tools } = get();
    if (!workspace) return false;
    const target = workspace.container.find((c) => c.id === id);
    if (!target) return false;
    const tool = tools.find((t) => t.id === target.toolId);
    if (!toolErlaubtResize(tool)) return false;
    const minB = toolMinBreite(tool);
    const minH = toolMinHoehe(tool);
    const clampedBreite = Math.max(minB, Math.min(breite, workspace.spalten));
    const clampedHoehe = Math.max(minH, hoehe);
    const candidate = clampContainerToGrid(
      { ...target, breite: clampedBreite, hoehe: clampedHoehe },
      workspace.spalten,
    );
    if (candidate.breite === target.breite && candidate.hoehe === target.hoehe) {
      return false;
    }
    if (hasCollision(candidate, workspace.container)) return false;
    const container = workspace.container.map((c) => (c.id === id ? candidate : c));
    set({ workspace: { ...workspace, container } });
    return true;
  },

  fuegeContainerHinzu: (toolId) => {
    const { workspace, tools } = get();
    if (!workspace) return;
    const tool = tools.find((t) => t.id === toolId);
    const breite = toolStandardBreite(tool);
    const hoehe = toolStandardHoehe(tool);
    const pos = findFreePosition(workspace.container, breite, hoehe, workspace.spalten);
    const container: Container = {
      id: nextId(`container-${toolId}`),
      toolId,
      x: pos.x,
      y: pos.y,
      breite,
      hoehe,
    };
    set({
      workspace: { ...workspace, container: [...workspace.container, container] },
      addPanelOpen: false,
    });
  },

  entferneContainer: (id) => {
    const { workspace, selectedContainerId } = get();
    if (!workspace) return;
    const container = workspace.container.filter((c) => c.id !== id);
    set({
      workspace: { ...workspace, container },
      selectedContainerId: selectedContainerId === id ? null : selectedContainerId,
    });
  },

  dupliziereContainer: (id) => {
    const { workspace } = get();
    if (!workspace) return;
    const target = workspace.container.find((c) => c.id === id);
    if (!target) return;
    const pos = findFreePosition(
      workspace.container,
      target.breite,
      target.hoehe,
      workspace.spalten,
    );
    const copy: Container = {
      ...target,
      id: nextId(`container-${target.toolId}`),
      x: pos.x,
      y: pos.y,
    };
    set({
      workspace: { ...workspace, container: [...workspace.container, copy] },
    });
  },

  findeTool: (toolId) => get().tools.find((t) => t.id === toolId),
}));

// Test-Helper: ersetzt den Workspace direkt (ohne API).
export function __setWorkspaceForTest(workspace: Workspace): void {
  useWorkspaceStore.setState({
    workspace: cloneWorkspace(workspace),
    ladeStatus: "bereit",
  });
}
