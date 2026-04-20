import { beforeEach, describe, expect, it } from "vitest";
import { selectActiveLayout, useWorkspaceStore } from "../features/workspace/model/workspace.store";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import type { WorkspaceLayout } from "../features/workspace/model/workspace.types";

function cloneLayout(l: WorkspaceLayout): WorkspaceLayout {
  return { ...l, items: l.items.map((i) => ({ ...i })) };
}

function seedSingle(): void {
  const layout = cloneLayout(DEFAULT_LAYOUT);
  useWorkspaceStore.setState({
    workspaces: { [layout.id]: layout },
    order: [layout.id],
    activeWorkspaceId: layout.id,
    editMode: false,
    selectedPanelId: null,
    addPanelOpen: false,
  });
}

function items() {
  return selectActiveLayout(useWorkspaceStore.getState()).items;
}

beforeEach(() => {
  localStorage.clear();
  seedSingle();
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
    const before = items().length;
    useWorkspaceStore.getState().addItem("schnellnotiz");
    const after = items();
    expect(after.length).toBe(before + 1);
    const added = after[after.length - 1];
    expect(added.panelTyp).toBe("schnellnotiz");
    expect(added.w).toBe(3);
    expect(added.h).toBe(2);
    expect(added.titel).toBe("Schnellnotiz");
  });

  it("places the new item on a free position", () => {
    useWorkspaceStore.getState().addItem("schnellnotiz");
    const after = items();
    const added = after[after.length - 1];
    const others = after.slice(0, -1);
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
    expect(items().map((i) => i.id)).not.toContain("panel-aufgaben");
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
    const beforeCount = items().length;
    useWorkspaceStore.getState().duplicateItem("panel-aufgaben");
    const after = items();
    expect(after.length).toBe(beforeCount + 1);
    const original = after.find((i) => i.id === "panel-aufgaben")!;
    const clone = after[after.length - 1];
    expect(clone.id).not.toBe(original.id);
    expect(clone.panelTyp).toBe(original.panelTyp);
    expect(clone.w).toBe(original.w);
    expect(clone.h).toBe(original.h);
  });

  it("is a no-op for an unknown id", () => {
    const before = items().length;
    useWorkspaceStore.getState().duplicateItem("nope");
    expect(items().length).toBe(before);
  });
});

describe("moveItem collision handling", () => {
  it("rejects a move that would overlap another panel", () => {
    const ok = useWorkspaceStore.getState().moveItem("panel-schnellnotiz", 3, 0);
    expect(ok).toBe(false);
    const item = items().find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.x).toBe(0);
  });

  it("accepts a move to a free position", () => {
    useWorkspaceStore.getState().removeItem("panel-letzteInhalte");
    const ok = useWorkspaceStore.getState().moveItem("panel-dateien", 5, 2);
    expect(ok).toBe(true);
    const item = items().find((i) => i.id === "panel-dateien")!;
    expect(item.x).toBe(5);
    expect(item.y).toBe(2);
  });
});

describe("resizeItem collision and constraints", () => {
  it("rejects a resize that would overlap a neighbour", () => {
    const ok = useWorkspaceStore.getState().resizeItem("panel-schnellnotiz", 6, 2);
    expect(ok).toBe(false);
    const item = items().find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.w).toBe(3);
  });

  it("enforces the registry minimum width", () => {
    useWorkspaceStore.getState().resizeItem("panel-schnellnotiz", 0, 2);
    const item = items().find((i) => i.id === "panel-schnellnotiz")!;
    expect(item.w).toBeGreaterThanOrEqual(2);
  });
});

describe("resetLayout", () => {
  it("restores the start-template layout for the active workspace", () => {
    useWorkspaceStore.getState().removeItem("panel-aufgaben");
    useWorkspaceStore.getState().resetLayout();
    expect(items().length).toBe(DEFAULT_LAYOUT.items.length);
  });

  it("clears selection", () => {
    useWorkspaceStore.setState({ selectedPanelId: "panel-aufgaben" });
    useWorkspaceStore.getState().resetLayout();
    expect(useWorkspaceStore.getState().selectedPanelId).toBeNull();
  });

  it("persists to the v2 storage key", () => {
    useWorkspaceStore.getState().resetLayout();
    expect(localStorage.getItem("mainhub.workspaces.v2")).not.toBeNull();
  });
});

describe("renameItem", () => {
  it("updates the title", () => {
    const ok = useWorkspaceStore.getState().renameItem("panel-aufgaben", "Mein ToDo");
    expect(ok).toBe(true);
    const item = items().find((i) => i.id === "panel-aufgaben")!;
    expect(item.titel).toBe("Mein ToDo");
  });

  it("trims surrounding whitespace", () => {
    useWorkspaceStore.getState().renameItem("panel-aufgaben", "  Kurz  ");
    const item = items().find((i) => i.id === "panel-aufgaben")!;
    expect(item.titel).toBe("Kurz");
  });

  it("rejects an empty title", () => {
    const ok = useWorkspaceStore.getState().renameItem("panel-aufgaben", "   ");
    expect(ok).toBe(false);
    const item = items().find((i) => i.id === "panel-aufgaben")!;
    expect(item.titel).toBe("Aufgaben");
  });

  it("returns false for an unknown id", () => {
    const ok = useWorkspaceStore.getState().renameItem("does-not-exist", "Foo");
    expect(ok).toBe(false);
  });

  it("is a no-op if the title does not change", () => {
    const ok = useWorkspaceStore.getState().renameItem("panel-aufgaben", "Aufgaben");
    expect(ok).toBe(false);
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
