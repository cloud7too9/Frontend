import { beforeEach, describe, expect, it } from "vitest";
import {
  __setWorkspaceForTest,
  useWorkspaceStore,
} from "../features/workspace/model/workspace.store";
import type { Tool, Workspace } from "../features/workspace/model/workspace.types";

const TEST_TOOLS: Tool[] = [
  {
    id: "tool-schnellnotiz",
    name: "Schnellnotiz",
    typ: "intern",
    quelle: "schnellnotiz",
    standardBreite: 3,
    standardHoehe: 2,
    minBreite: 2,
    minHoehe: 1,
    erlaubtResize: true,
  },
  {
    id: "tool-aufgaben",
    name: "Aufgaben",
    typ: "intern",
    quelle: "aufgaben",
    standardBreite: 3,
    standardHoehe: 2,
    minBreite: 2,
    minHoehe: 2,
    erlaubtResize: true,
  },
  {
    id: "tool-dateien",
    name: "Dateien",
    typ: "intern",
    quelle: "dateien",
    standardBreite: 4,
    standardHoehe: 2,
    minBreite: 2,
    minHoehe: 1,
    erlaubtResize: true,
  },
];

const TEST_WORKSPACE: Workspace = {
  id: "default",
  name: "Start",
  spalten: 12,
  zeilenHoehe: 80,
  container: [
    { id: "c-schnellnotiz", toolId: "tool-schnellnotiz", x: 0, y: 0, breite: 3, hoehe: 2 },
    { id: "c-aufgaben", toolId: "tool-aufgaben", x: 3, y: 0, breite: 3, hoehe: 2 },
    { id: "c-dateien", toolId: "tool-dateien", x: 0, y: 2, breite: 4, hoehe: 2 },
  ],
};

beforeEach(() => {
  useWorkspaceStore.setState({
    workspace: null,
    tools: TEST_TOOLS,
    editMode: false,
    selectedContainerId: null,
    addPanelOpen: false,
    ladeStatus: "idle",
    ladeFehler: null,
    speicherLaeuft: false,
  });
  __setWorkspaceForTest(TEST_WORKSPACE);
});

describe("editMode transitions", () => {
  it("setEditMode(true) keeps existing selection", () => {
    useWorkspaceStore.setState({ selectedContainerId: "c-aufgaben" });
    useWorkspaceStore.getState().setEditMode(true);
    expect(useWorkspaceStore.getState().editMode).toBe(true);
    expect(useWorkspaceStore.getState().selectedContainerId).toBe("c-aufgaben");
  });

  it("setEditMode(false) clears selection", () => {
    useWorkspaceStore.setState({ editMode: true, selectedContainerId: "c-aufgaben" });
    useWorkspaceStore.getState().setEditMode(false);
    expect(useWorkspaceStore.getState().editMode).toBe(false);
    expect(useWorkspaceStore.getState().selectedContainerId).toBeNull();
  });

  it("toggleEditMode routes through setEditMode (clears selection on exit)", () => {
    useWorkspaceStore.setState({ editMode: true, selectedContainerId: "c-aufgaben" });
    useWorkspaceStore.getState().toggleEditMode();
    expect(useWorkspaceStore.getState().editMode).toBe(false);
    expect(useWorkspaceStore.getState().selectedContainerId).toBeNull();
  });

  it("toggleEditMode back on keeps selection null", () => {
    useWorkspaceStore.getState().toggleEditMode();
    expect(useWorkspaceStore.getState().editMode).toBe(true);
    expect(useWorkspaceStore.getState().selectedContainerId).toBeNull();
  });
});

describe("fuegeContainerHinzu", () => {
  it("appends a new container with tool defaults", () => {
    const before = useWorkspaceStore.getState().workspace!.container.length;
    useWorkspaceStore.getState().fuegeContainerHinzu("tool-schnellnotiz");
    const container = useWorkspaceStore.getState().workspace!.container;
    expect(container.length).toBe(before + 1);
    const added = container[container.length - 1];
    expect(added.toolId).toBe("tool-schnellnotiz");
    expect(added.breite).toBe(3);
    expect(added.hoehe).toBe(2);
  });

  it("places the new container on a free position", () => {
    useWorkspaceStore.getState().fuegeContainerHinzu("tool-schnellnotiz");
    const container = useWorkspaceStore.getState().workspace!.container;
    const added = container[container.length - 1];
    const others = container.slice(0, -1);
    for (const o of others) {
      const overlap =
        added.x < o.x + o.breite &&
        added.x + added.breite > o.x &&
        added.y < o.y + o.hoehe &&
        added.y + added.hoehe > o.y;
      expect(overlap).toBe(false);
    }
  });

  it("closes the add-panel overlay", () => {
    useWorkspaceStore.setState({ addPanelOpen: true });
    useWorkspaceStore.getState().fuegeContainerHinzu("tool-schnellnotiz");
    expect(useWorkspaceStore.getState().addPanelOpen).toBe(false);
  });
});

describe("entferneContainer", () => {
  it("removes the target container", () => {
    useWorkspaceStore.getState().entferneContainer("c-aufgaben");
    const ids = useWorkspaceStore.getState().workspace!.container.map((c) => c.id);
    expect(ids).not.toContain("c-aufgaben");
  });

  it("clears selection if the removed container was selected", () => {
    useWorkspaceStore.setState({ selectedContainerId: "c-aufgaben" });
    useWorkspaceStore.getState().entferneContainer("c-aufgaben");
    expect(useWorkspaceStore.getState().selectedContainerId).toBeNull();
  });

  it("leaves other selections intact", () => {
    useWorkspaceStore.setState({ selectedContainerId: "c-dateien" });
    useWorkspaceStore.getState().entferneContainer("c-aufgaben");
    expect(useWorkspaceStore.getState().selectedContainerId).toBe("c-dateien");
  });
});

describe("dupliziereContainer", () => {
  it("creates a new container with fresh id but same tool", () => {
    const beforeCount = useWorkspaceStore.getState().workspace!.container.length;
    useWorkspaceStore.getState().dupliziereContainer("c-aufgaben");
    const container = useWorkspaceStore.getState().workspace!.container;
    expect(container.length).toBe(beforeCount + 1);
    const original = container.find((c) => c.id === "c-aufgaben")!;
    const clone = container[container.length - 1];
    expect(clone.id).not.toBe(original.id);
    expect(clone.toolId).toBe(original.toolId);
    expect(clone.breite).toBe(original.breite);
    expect(clone.hoehe).toBe(original.hoehe);
  });

  it("is a no-op for an unknown id", () => {
    const before = useWorkspaceStore.getState().workspace!.container.length;
    useWorkspaceStore.getState().dupliziereContainer("nope");
    expect(useWorkspaceStore.getState().workspace!.container.length).toBe(before);
  });
});

describe("verschiebeContainer collision handling", () => {
  it("rejects a move that would overlap another container", () => {
    const ok = useWorkspaceStore.getState().verschiebeContainer("c-schnellnotiz", 3, 0);
    expect(ok).toBe(false);
    const c = useWorkspaceStore
      .getState()
      .workspace!.container.find((it) => it.id === "c-schnellnotiz")!;
    expect(c.x).toBe(0);
  });

  it("accepts a move to a free position", () => {
    const ok = useWorkspaceStore.getState().verschiebeContainer("c-dateien", 5, 2);
    expect(ok).toBe(true);
    const c = useWorkspaceStore
      .getState()
      .workspace!.container.find((it) => it.id === "c-dateien")!;
    expect(c.x).toBe(5);
    expect(c.y).toBe(2);
  });
});

describe("aendereContainerGroesse collision and constraints", () => {
  it("rejects a resize that would overlap a neighbour", () => {
    const ok = useWorkspaceStore
      .getState()
      .aendereContainerGroesse("c-schnellnotiz", 6, 2);
    expect(ok).toBe(false);
    const c = useWorkspaceStore
      .getState()
      .workspace!.container.find((it) => it.id === "c-schnellnotiz")!;
    expect(c.breite).toBe(3);
  });

  it("enforces the tool minimum breite", () => {
    useWorkspaceStore.getState().aendereContainerGroesse("c-schnellnotiz", 0, 2);
    const c = useWorkspaceStore
      .getState()
      .workspace!.container.find((it) => it.id === "c-schnellnotiz")!;
    expect(c.breite).toBeGreaterThanOrEqual(2);
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

describe("findeTool", () => {
  it("returns the matching tool", () => {
    const tool = useWorkspaceStore.getState().findeTool("tool-aufgaben");
    expect(tool?.name).toBe("Aufgaben");
  });

  it("returns undefined for unknown id", () => {
    expect(useWorkspaceStore.getState().findeTool("nope")).toBeUndefined();
  });
});
