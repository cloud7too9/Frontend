import { create } from "zustand";
import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem, PanelTyp, WorkspaceLayout } from "./workspace.types";
import { DEFAULT_TEMPLATES, START_TEMPLATE_ID, getTemplate } from "./default-templates";
import { PANEL_REGISTRY } from "./panel-registry";
import { clampItemToGrid, findFreePosition } from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import {
  type WorkspacesCollection,
  loadWorkspacesFromStorage,
  saveWorkspacesToStorage,
  clearWorkspacesStorage,
} from "../lib/storage";

interface WorkspaceState {
  workspaces: Record<Id, WorkspaceLayout>;
  order: Id[];
  activeWorkspaceId: Id;
  editMode: boolean;
  selectedPanelId: Id | null;
  addPanelOpen: boolean;

  setEditMode: (value: boolean) => void;
  toggleEditMode: () => void;
  selectPanel: (id: Id | null) => void;
  openAddPanel: () => void;
  closeAddPanel: () => void;

  moveItem: (id: Id, x: number, y: number) => boolean;
  resizeItem: (id: Id, w: number, h: number) => boolean;
  renameItem: (id: Id, titel: string) => boolean;
  addItem: (typ: PanelTyp) => void;
  removeItem: (id: Id) => void;
  duplicateItem: (id: Id) => void;

  createWorkspace: (templateId: string, name?: string) => Id;
  switchWorkspace: (id: Id) => void;
  renameWorkspace: (id: Id, name: string) => boolean;
  duplicateWorkspace: (id: Id) => Id | null;
  deleteWorkspace: (id: Id) => boolean;

  resetLayout: () => void;
  loadWorkspaces: () => void;
  saveLayoutNow: () => void;
}

function cloneLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return { ...layout, items: layout.items.map((i) => ({ ...i })) };
}

function nextId(prefix: string): Id {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function initialCollection(): WorkspacesCollection {
  const loaded = loadWorkspacesFromStorage();
  if (loaded) return loaded;
  const startTpl = getTemplate(START_TEMPLATE_ID) ?? DEFAULT_TEMPLATES[0];
  const id = nextId("ws");
  const layout = startTpl.createLayout(id, startTpl.name);
  return { activeWorkspaceId: id, order: [id], workspaces: { [id]: layout } };
}

export function selectActiveLayout(state: {
  workspaces: Record<Id, WorkspaceLayout>;
  activeWorkspaceId: Id;
}): WorkspaceLayout {
  return state.workspaces[state.activeWorkspaceId];
}

function snapshotCollection(state: WorkspaceState): WorkspacesCollection {
  return {
    activeWorkspaceId: state.activeWorkspaceId,
    order: state.order,
    workspaces: state.workspaces,
  };
}

function withUpdatedActive(
  state: WorkspaceState,
  updater: (layout: WorkspaceLayout) => WorkspaceLayout,
): { workspaces: Record<Id, WorkspaceLayout> } {
  const current = state.workspaces[state.activeWorkspaceId];
  const updated = updater(current);
  return {
    workspaces: { ...state.workspaces, [state.activeWorkspaceId]: updated },
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  const initial = initialCollection();
  return {
    workspaces: initial.workspaces,
    order: initial.order,
    activeWorkspaceId: initial.activeWorkspaceId,
    editMode: false,
    selectedPanelId: null,
    addPanelOpen: false,

    setEditMode: (value) => {
      set({ editMode: value, selectedPanelId: value ? get().selectedPanelId : null });
    },
    toggleEditMode: () => {
      get().setEditMode(!get().editMode);
    },
    selectPanel: (id) => set({ selectedPanelId: id }),
    openAddPanel: () => set({ addPanelOpen: true }),
    closeAddPanel: () => set({ addPanelOpen: false }),

    moveItem: (id, x, y) => {
      const state = get();
      const layout = selectActiveLayout(state);
      const target = layout.items.find((i) => i.id === id);
      if (!target) return false;
      const candidate = clampItemToGrid({ ...target, x, y }, layout.spalten);
      if (candidate.x === target.x && candidate.y === target.y) return false;
      if (hasCollision(candidate, layout.items)) return false;
      const items = layout.items.map((i) => (i.id === id ? candidate : i));
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set(patch);
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
      return true;
    },

    resizeItem: (id, w, h) => {
      const state = get();
      const layout = selectActiveLayout(state);
      const target = layout.items.find((i) => i.id === id);
      if (!target) return false;
      const def = PANEL_REGISTRY[target.panelTyp];
      if (!def.erlaubtResize) return false;
      const minW = target.minW ?? def.minBreite;
      const minH = target.minH ?? def.minHoehe;
      const clampedW = Math.max(minW, Math.min(w, layout.spalten));
      const clampedH = Math.max(minH, h);
      const candidate = clampItemToGrid(
        { ...target, w: clampedW, h: clampedH },
        layout.spalten,
      );
      if (candidate.w === target.w && candidate.h === target.h) return false;
      if (hasCollision(candidate, layout.items)) return false;
      const items = layout.items.map((i) => (i.id === id ? candidate : i));
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set(patch);
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
      return true;
    },

    renameItem: (id, titel) => {
      const trimmed = titel.trim();
      if (!trimmed) return false;
      const state = get();
      const layout = selectActiveLayout(state);
      const target = layout.items.find((i) => i.id === id);
      if (!target) return false;
      if (target.titel === trimmed) return false;
      const items = layout.items.map((i) => (i.id === id ? { ...i, titel: trimmed } : i));
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set(patch);
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
      return true;
    },

    addItem: (typ) => {
      const state = get();
      const layout = selectActiveLayout(state);
      const def = PANEL_REGISTRY[typ];
      const pos = findFreePosition(
        layout.items,
        def.standardBreite,
        def.standardHoehe,
        layout.spalten,
      );
      const item: LayoutItem = {
        id: nextId(`panel-${typ}`),
        panelTyp: typ,
        titel: def.standardTitel,
        x: pos.x,
        y: pos.y,
        w: def.standardBreite,
        h: def.standardHoehe,
        minW: def.minBreite,
        minH: def.minHoehe,
      };
      const items = [...layout.items, item];
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set({ ...patch, addPanelOpen: false });
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
    },

    removeItem: (id) => {
      const state = get();
      const layout = selectActiveLayout(state);
      const items = layout.items.filter((i) => i.id !== id);
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set({
        ...patch,
        selectedPanelId: state.selectedPanelId === id ? null : state.selectedPanelId,
      });
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
    },

    duplicateItem: (id) => {
      const state = get();
      const layout = selectActiveLayout(state);
      const target = layout.items.find((i) => i.id === id);
      if (!target) return;
      const pos = findFreePosition(layout.items, target.w, target.h, layout.spalten);
      const copy: LayoutItem = {
        ...target,
        id: nextId(`panel-${target.panelTyp}`),
        x: pos.x,
        y: pos.y,
      };
      const items = [...layout.items, copy];
      const patch = withUpdatedActive(state, (l) => ({ ...l, items }));
      set(patch);
      saveWorkspacesToStorage({ ...snapshotCollection(state), ...patch });
    },

    createWorkspace: (templateId, name) => {
      const tpl = getTemplate(templateId) ?? DEFAULT_TEMPLATES[0];
      const id = nextId("ws");
      const chosenName = (name ?? "").trim() || tpl.name;
      const layout = tpl.createLayout(id, chosenName);
      const state = get();
      const workspaces = { ...state.workspaces, [id]: layout };
      const order = [...state.order, id];
      set({
        workspaces,
        order,
        activeWorkspaceId: id,
        selectedPanelId: null,
        editMode: false,
        addPanelOpen: false,
      });
      saveWorkspacesToStorage({ activeWorkspaceId: id, order, workspaces });
      return id;
    },

    switchWorkspace: (id) => {
      const state = get();
      if (!state.workspaces[id]) return;
      if (state.activeWorkspaceId === id) return;
      set({
        activeWorkspaceId: id,
        selectedPanelId: null,
        editMode: false,
        addPanelOpen: false,
      });
      saveWorkspacesToStorage({
        activeWorkspaceId: id,
        order: state.order,
        workspaces: state.workspaces,
      });
    },

    renameWorkspace: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const state = get();
      const current = state.workspaces[id];
      if (!current) return false;
      if (current.name === trimmed) return false;
      const workspaces = { ...state.workspaces, [id]: { ...current, name: trimmed } };
      set({ workspaces });
      saveWorkspacesToStorage({
        activeWorkspaceId: state.activeWorkspaceId,
        order: state.order,
        workspaces,
      });
      return true;
    },

    duplicateWorkspace: (id) => {
      const state = get();
      const source = state.workspaces[id];
      if (!source) return null;
      const newId = nextId("ws");
      const copy: WorkspaceLayout = {
        ...source,
        id: newId,
        name: `${source.name} (Kopie)`,
        items: source.items.map((it, idx) => ({
          ...it,
          id: `panel-${it.panelTyp}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
        })),
      };
      const workspaces = { ...state.workspaces, [newId]: copy };
      const sourceIndex = state.order.indexOf(id);
      const order = [...state.order];
      order.splice(sourceIndex + 1, 0, newId);
      set({
        workspaces,
        order,
        activeWorkspaceId: newId,
        selectedPanelId: null,
        editMode: false,
        addPanelOpen: false,
      });
      saveWorkspacesToStorage({ activeWorkspaceId: newId, order, workspaces });
      return newId;
    },

    deleteWorkspace: (id) => {
      const state = get();
      if (state.order.length <= 1) return false;
      if (!state.workspaces[id]) return false;
      const workspaces = { ...state.workspaces };
      delete workspaces[id];
      const order = state.order.filter((x) => x !== id);
      let activeWorkspaceId = state.activeWorkspaceId;
      if (activeWorkspaceId === id) {
        const removedIndex = state.order.indexOf(id);
        const fallbackIndex = removedIndex >= order.length ? order.length - 1 : removedIndex;
        activeWorkspaceId = order[fallbackIndex];
      }
      set({
        workspaces,
        order,
        activeWorkspaceId,
        selectedPanelId: null,
        editMode: false,
        addPanelOpen: false,
      });
      saveWorkspacesToStorage({ activeWorkspaceId, order, workspaces });
      return true;
    },

    resetLayout: () => {
      const state = get();
      const startTpl = getTemplate(START_TEMPLATE_ID) ?? DEFAULT_TEMPLATES[0];
      const activeId = state.activeWorkspaceId;
      const fresh = startTpl.createLayout(activeId, state.workspaces[activeId]?.name ?? startTpl.name);
      const workspaces = { ...state.workspaces, [activeId]: fresh };
      set({ workspaces, selectedPanelId: null });
      saveWorkspacesToStorage({
        activeWorkspaceId: activeId,
        order: state.order,
        workspaces,
      });
    },

    loadWorkspaces: () => {
      const loaded = loadWorkspacesFromStorage();
      if (loaded) {
        set({
          workspaces: loaded.workspaces,
          order: loaded.order,
          activeWorkspaceId: loaded.activeWorkspaceId,
        });
      }
    },

    saveLayoutNow: () => {
      saveWorkspacesToStorage(snapshotCollection(get()));
    },
  };
});

export { clearWorkspacesStorage };
export { cloneLayout };
