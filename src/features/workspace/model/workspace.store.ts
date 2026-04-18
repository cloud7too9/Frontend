import { create } from "zustand";
import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem, PanelTyp, WorkspaceLayout } from "./workspace.types";
import { DEFAULT_LAYOUT } from "./default-layout";
import { PANEL_REGISTRY } from "./panel-registry";
import { clampItemToGrid, findFreePosition } from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import {
  clearLayoutStorage,
  loadLayoutFromStorage,
  saveLayoutToStorage,
} from "../lib/storage";

interface WorkspaceState {
  layout: WorkspaceLayout;
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

  resetLayout: () => void;
  loadLayout: () => void;
  saveLayoutNow: () => void;
}

function cloneLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return { ...layout, items: layout.items.map((i) => ({ ...i })) };
}

function nextId(prefix: string): Id {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  layout: cloneLayout(DEFAULT_LAYOUT),
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
    const { layout } = get();
    const target = layout.items.find((i) => i.id === id);
    if (!target) return false;
    const candidate = clampItemToGrid({ ...target, x, y }, layout.spalten);
    if (candidate.x === target.x && candidate.y === target.y) return false;
    if (hasCollision(candidate, layout.items)) return false;
    const items = layout.items.map((i) => (i.id === id ? candidate : i));
    set({ layout: { ...layout, items } });
    saveLayoutToStorage({ ...layout, items });
    return true;
  },

  resizeItem: (id, w, h) => {
    const { layout } = get();
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
    set({ layout: { ...layout, items } });
    saveLayoutToStorage({ ...layout, items });
    return true;
  },

  renameItem: (id, titel) => {
    const trimmed = titel.trim();
    if (!trimmed) return false;
    const { layout } = get();
    const target = layout.items.find((i) => i.id === id);
    if (!target) return false;
    if (target.titel === trimmed) return false;
    const items = layout.items.map((i) => (i.id === id ? { ...i, titel: trimmed } : i));
    set({ layout: { ...layout, items } });
    saveLayoutToStorage({ ...layout, items });
    return true;
  },

  addItem: (typ) => {
    const { layout } = get();
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
    set({ layout: { ...layout, items }, addPanelOpen: false });
    saveLayoutToStorage({ ...layout, items });
  },

  removeItem: (id) => {
    const { layout, selectedPanelId } = get();
    const items = layout.items.filter((i) => i.id !== id);
    set({
      layout: { ...layout, items },
      selectedPanelId: selectedPanelId === id ? null : selectedPanelId,
    });
    saveLayoutToStorage({ ...layout, items });
  },

  duplicateItem: (id) => {
    const { layout } = get();
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
    set({ layout: { ...layout, items } });
    saveLayoutToStorage({ ...layout, items });
  },

  resetLayout: () => {
    const fresh = cloneLayout(DEFAULT_LAYOUT);
    set({ layout: fresh, selectedPanelId: null });
    clearLayoutStorage();
  },

  loadLayout: () => {
    const loaded = loadLayoutFromStorage();
    if (loaded) set({ layout: loaded });
  },

  saveLayoutNow: () => {
    saveLayoutToStorage(get().layout);
  },
}));
