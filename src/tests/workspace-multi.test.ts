import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceStore } from "../features/workspace/model/workspace.store";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import { DEFAULT_TEMPLATES } from "../features/workspace/model/default-templates";
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

beforeEach(() => {
  localStorage.clear();
  seedSingle();
});

describe("createWorkspace", () => {
  it("appends and activates a new workspace from each template", () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      const beforeLen = useWorkspaceStore.getState().order.length;
      const id = useWorkspaceStore.getState().createWorkspace(tpl.id, `Test ${tpl.name}`);
      const state = useWorkspaceStore.getState();
      expect(state.order.length).toBe(beforeLen + 1);
      expect(state.activeWorkspaceId).toBe(id);
      expect(state.workspaces[id].name).toBe(`Test ${tpl.name}`);
      expect(state.workspaces[id].items.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the template name when no name is given", () => {
    const id = useWorkspaceStore.getState().createWorkspace("tpl-analyse");
    expect(useWorkspaceStore.getState().workspaces[id].name).toBe("Analyse");
  });

  it("trims a provided name and falls back if empty", () => {
    const id = useWorkspaceStore.getState().createWorkspace("tpl-start", "   ");
    expect(useWorkspaceStore.getState().workspaces[id].name).toBe("Start");
  });
});

describe("switchWorkspace", () => {
  it("changes the active id and resets ui state", () => {
    const id = useWorkspaceStore.getState().createWorkspace("tpl-ideen", "B");
    useWorkspaceStore.setState({ editMode: true, selectedPanelId: "something" });
    const seeded = DEFAULT_LAYOUT.id;
    useWorkspaceStore.getState().switchWorkspace(seeded);
    const state = useWorkspaceStore.getState();
    expect(state.activeWorkspaceId).toBe(seeded);
    expect(state.editMode).toBe(false);
    expect(state.selectedPanelId).toBeNull();
    expect(id).not.toBe(seeded);
  });

  it("is a no-op for an unknown id", () => {
    const before = useWorkspaceStore.getState().activeWorkspaceId;
    useWorkspaceStore.getState().switchWorkspace("ghost");
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(before);
  });
});

describe("renameWorkspace", () => {
  it("updates the name of an existing workspace", () => {
    const id = useWorkspaceStore.getState().activeWorkspaceId;
    const ok = useWorkspaceStore.getState().renameWorkspace(id, "Mein Start");
    expect(ok).toBe(true);
    expect(useWorkspaceStore.getState().workspaces[id].name).toBe("Mein Start");
  });

  it("trims and rejects an empty name", () => {
    const id = useWorkspaceStore.getState().activeWorkspaceId;
    expect(useWorkspaceStore.getState().renameWorkspace(id, "   ")).toBe(false);
  });

  it("returns false when the name did not change", () => {
    const id = useWorkspaceStore.getState().activeWorkspaceId;
    const current = useWorkspaceStore.getState().workspaces[id].name;
    expect(useWorkspaceStore.getState().renameWorkspace(id, current)).toBe(false);
  });

  it("returns false for an unknown id", () => {
    expect(useWorkspaceStore.getState().renameWorkspace("ghost", "Foo")).toBe(false);
  });
});

describe("duplicateWorkspace", () => {
  it("creates a copy with new workspace- and item-ids", () => {
    const sourceId = useWorkspaceStore.getState().activeWorkspaceId;
    const sourceItems = useWorkspaceStore.getState().workspaces[sourceId].items;
    const newId = useWorkspaceStore.getState().duplicateWorkspace(sourceId);
    expect(newId).not.toBeNull();
    expect(newId).not.toBe(sourceId);
    const state = useWorkspaceStore.getState();
    expect(state.activeWorkspaceId).toBe(newId);
    const copy = state.workspaces[newId!];
    expect(copy.name.endsWith("(Kopie)")).toBe(true);
    expect(copy.items.length).toBe(sourceItems.length);
    for (const item of copy.items) {
      const sourceIds = sourceItems.map((s) => s.id);
      expect(sourceIds).not.toContain(item.id);
    }
  });

  it("inserts the duplicate directly after the source in order", () => {
    const sourceId = useWorkspaceStore.getState().activeWorkspaceId;
    const newId = useWorkspaceStore.getState().duplicateWorkspace(sourceId);
    const order = useWorkspaceStore.getState().order;
    expect(order.indexOf(newId!)).toBe(order.indexOf(sourceId) + 1);
  });

  it("returns null for unknown id", () => {
    expect(useWorkspaceStore.getState().duplicateWorkspace("ghost")).toBeNull();
  });
});

describe("deleteWorkspace", () => {
  it("refuses to delete the last workspace", () => {
    const id = useWorkspaceStore.getState().activeWorkspaceId;
    expect(useWorkspaceStore.getState().deleteWorkspace(id)).toBe(false);
    expect(useWorkspaceStore.getState().order.length).toBe(1);
  });

  it("removes a non-active workspace without switching", () => {
    const first = useWorkspaceStore.getState().activeWorkspaceId;
    const second = useWorkspaceStore.getState().createWorkspace("tpl-analyse", "Zweites");
    useWorkspaceStore.getState().switchWorkspace(first);
    const ok = useWorkspaceStore.getState().deleteWorkspace(second);
    expect(ok).toBe(true);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(first);
    expect(useWorkspaceStore.getState().workspaces[second]).toBeUndefined();
  });

  it("activates the neighbour when the active workspace is deleted", () => {
    const first = useWorkspaceStore.getState().activeWorkspaceId;
    const second = useWorkspaceStore.getState().createWorkspace("tpl-analyse", "Zweites");
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(second);
    useWorkspaceStore.getState().deleteWorkspace(second);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(first);
  });
});

describe("workspace isolation", () => {
  it("moveItem only affects the active workspace", () => {
    const first = useWorkspaceStore.getState().activeWorkspaceId;
    const second = useWorkspaceStore.getState().createWorkspace("tpl-inhalte", "Andere");
    const firstItemsBefore = useWorkspaceStore.getState().workspaces[first].items.map((i) => ({
      id: i.id,
      x: i.x,
      y: i.y,
    }));

    const secondLayout = useWorkspaceStore.getState().workspaces[second];
    const someItem = secondLayout.items[0];
    useWorkspaceStore.getState().moveItem(someItem.id, someItem.x, someItem.y);

    const firstItemsAfter = useWorkspaceStore.getState().workspaces[first].items.map((i) => ({
      id: i.id,
      x: i.x,
      y: i.y,
    }));
    expect(firstItemsAfter).toEqual(firstItemsBefore);
  });

  it("addItem lands in the active workspace only", () => {
    const first = useWorkspaceStore.getState().activeWorkspaceId;
    const firstLen = useWorkspaceStore.getState().workspaces[first].items.length;
    useWorkspaceStore.getState().createWorkspace("tpl-ideen", "Andere");
    useWorkspaceStore.getState().addItem("schnellnotiz");
    expect(useWorkspaceStore.getState().workspaces[first].items.length).toBe(firstLen);
  });
});

describe("active workspace persistence", () => {
  it("persists active id and order to the v2 key on create", () => {
    useWorkspaceStore.getState().createWorkspace("tpl-start", "Zweiter");
    const raw = localStorage.getItem("mainhub.workspaces.v2");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(2);
    expect(parsed.order.length).toBe(2);
    expect(parsed.activeWorkspaceId).toBe(parsed.order[1]);
  });
});
