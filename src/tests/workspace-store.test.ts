import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceStore } from "../features/workspace/model/workspace.store";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import type { WorkspaceLayout } from "../features/workspace/model/workspace.types";

function cloneLayout(l: WorkspaceLayout): WorkspaceLayout {
  return { ...l, items: l.items.map((i) => ({ ...i })) };
}

beforeEach(() => {
  localStorage.clear();
  useWorkspaceStore.setState({
    layout: cloneLayout(DEFAULT_LAYOUT),
    editMode: false,
    selectedPanelId: null,
    addPanelOpen: false,
  });
});

describe("editMode transitions", () => {
  it("setEditMode(true) keeps existing selection", () => {
    useWorkspaceStore.setState({ selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().setEditMode(true);
    expect(useWorkspaceStore.getState().editMode).toBe(true);
    expect(useWorkspaceStore.getState().selectedPanelId).toBe("panel-aufgaben");
  });

  it("setEditMode(false) clears selection", () => {
    useWorkspaceStore.setState({ editMode: true, selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().setEditMode(false);
    expect(useWorkspaceStore.getState().editMode).toBe(false);
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });

  it("toggleEditMode routes through setEditMode (clears selection on exit)", () => {
    useWorkspaceStore.setState({ editMode: true, selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().toggleEditMode();
    expect(useWorkspaceStore.getState().editMode).toBe(false);
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });

  it("toggleEditMode back on keeps selection null", () => {
    useWorkspaceStore.getState().toggleEditMode();
    expect(useWorkspaceStore.getState().editMode).toBe(true);
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });
});

describe("addItem", () => {
  it("appends a new item with registry defaults", () => {
    const before = useWorkspaceStore.getState().layout.items.length;
    useWorkspaceStore.getState().addItem("schnellnotiz");
    const items = useWorkspaceStore.getState().layout.items;
    expect(items.length).toBe(before + 1);
    const added = items[items.length - 1];
    expect(added.panelTyp).toBe("schnellnotiz");
    expect(added.w).toBe(3);
    expect(added.h).toBe(2);
    expect(added.titel).toBe("Schnellnotiz");
  });

  it("places the new item on a free position", () => {
    useWorkspaceStore.getState().addItem("schnellnotiz");
    const items = useWorkspaceStore.getState().layout.items;
    const added = items[items.length - 1];
    const others = items.slice(0, -1);
    for (const o of others) {
      const overlap =
        added.x < o.x + o.w &&
        added.x + added.w > o.x &&
        added.y < o.y + o.h &&
        added.y + added.h > o.y;
      expect(overlap).toBe(false);
    }
  });

  it("closes the add-panel overlay", () => {
    useWorkspaceStore.setState({ addPanelOpen: true });
    useWorkspaceStore.getState().addItem("schnellnotiz");
    expect(useWorkspaceStore.getState().addPanelOpen).toBe(false);
  });
});

describe("removeItem", () => {
  it("removes the target item", () => {
    useWorkspaceStore.getState().removeItem("panel-aufgaben");
    const ids = useWorkspaceStore.getState().layout.items.map((i) => i.id);
    expect(ids).not.toContain("panel-aufgaben");
  });

  it("clears selection if the removed panel was selected", () => {
    useWorkspaceStore.setState({ selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().removeItem("panel-aufgaben");
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });

  it("leaves other selections intact", () => {
    useWorkspaceStore.setState({ selectedPanelId: "panel-dateien" });
    useWorkspaceStore.getState().removeItem("panel-aufgaben");
    expect(useWorkspaceStore.getState().selectedPanelId).toBe("panel-dateien");
  });
});

describe("duplicateItem", () => {
  it("creates a new item with a fresh id but same type", () => {
    const beforeCount = useWorkspaceStore.getState().layout.items.length;
    useWorkspaceStore.getState().duplicateItem("panel-aufgaben");
    const items = useWorkspaceStore.getState().layout.items;
    expect(items.length).toBe(beforeCount + 1);
    const original = items.find((i) => i.id === "panel-aufgaben")!;
    const clone = items[items.length - 1];
    expect(clone.id).not.toBe(original.id);
    expect(clone.panelTyp).toBe(original.panelTyp);
    expect(clone.w).toBe(original.w);
    expect(clone.h).toBe(original.h);
  });

  it("is a no-op for an unknown id", () => {
    const before = useWorkspaceStore.getState().layout.items.length;
    useWorkspaceStore.getState().duplicateItem("nope");
    expect(useWorkspaceStore.getState().layout.items.length).toBe(before);
  });
});

describe("moveItem collision handling", () => {
  it("rejects a move that would overlap another panel", () => {
    const ok = useWorkspaceStore.getState().moveItem("panel-schnellnotiz", 3, 0);
    expect(ok).toBe(false);
    const item = useWorkspaceStore.getState().layout.items.find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.x).toBe(0);
  });

  it("accepts a move to a free position", () => {
    useWorkspaceStore.getState().removeItem("panel-letzteInhalte");
    const ok = useWorkspaceStore.getState().moveItem("panel-dateien", 5, 2);
    expect(ok).toBe(true);
    const item = useWorkspaceStore.getState().layout.items.find((i) => i.id === "panel-dateien")!;
    expect(item.x).toBe(5);
    expect(item.y).toBe(2);
  });
});

describe("resizeItem collision and constraints", () => {
  it("rejects a resize that would overlap a neighbour", () => {
    const ok = useWorkspaceStore.getState().resizeItem("panel-schnellnotiz", 6, 2);
    expect(ok).toBe(false);
    const item = useWorkspaceStore
      .getState()
      .layout.items.find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.w).toBe(3);
  });

  it("enforces the registry minimum width", () => {
    useWorkspaceStore.getState().resizeItem("panel-schnellnotiz", 0, 2);
    const item = useWorkspaceStore
      .getState()
      .layout.items.find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.w).toBeGreaterThanOrEqual(2);
  });
});

describe("resetLayout", () => {
  it("restores the default layout and clears storage", () => {
    useWorkspaceStore.getState().removeItem("panel-aufgaben");
    localStorage.setItem("mainhub.workspace.v1", "anything");
    useWorkspaceStore.getState().resetLayout();
    expect(useWorkspaceStore.getState().layout.items.length).toBe(DEFAULT_LAYOUT.items.length);
    expect(localStorage.getItem("mainhub.workspace.v1")).toBeNull();
  });

  it("clears selection", () => {
    useWorkspaceStore.setState({ selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().resetLayout();
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });
});

describe("add-panel overlay", () => {
  it("openAddPanel sets flag true", () => {
    useWorkspaceStore.getState().openAddPanel();
    expect(useWorkspaceStore.getState().addPanelOpen).toBe(true);
  });

  it("closeAddPanel sets flag false", () => {
    useWorkspaceStore.setState({ addPanelOpen: true });
    useWorkspaceStore.getState().closeAddPanel();
    expect(useWorkspaceStore.getState().addPanelOpen).toBe(false);
  });
});
