import { describe, expect, it, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import type { Tool, Workspace } from "@mainhub/shared";
import { workspaceStore } from "../src/lib/workspace.store.js";

const seed: Workspace = {
  id: "ws-1",
  name: "t",
  spalten: 12,
  zeilenHoehe: 80,
  container: [],
};

const tools: Tool[] = [
  { id: "tool-a", name: "A", typ: "intern", quelle: "a" },
  { id: "tool-b", name: "B", typ: "extern", quelle: "https://example.org" },
];

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function mockFetch(workspace: Workspace, toolList: Tool[], override?: Partial<{ onPut: FetchHandler }>) {
  let current = structuredClone(workspace);
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/workspace") && (!init || init.method === undefined || init.method === "GET")) {
      return new Response(JSON.stringify(current), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.endsWith("/api/workspace") && init?.method === "PUT") {
      if (override?.onPut) return override.onPut(input, init);
      current = JSON.parse(init.body as string) as Workspace;
      return new Response(JSON.stringify(current), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.endsWith("/api/tools")) {
      return new Response(JSON.stringify(toolList), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

async function resetStore() {
  mockFetch(seed, tools);
  await workspaceStore.loadInitial();
}

describe("workspaceStore", () => {
  beforeEach(async () => {
    await resetStore();
    workspaceStore.setEditor(true);
  });

  it("loadInitial holt Workspace und Tools und setzt saveState=gespeichert", () => {
    const s = get(workspaceStore);
    expect(s.workspace?.id).toBe("ws-1");
    expect(s.tools).toHaveLength(2);
    expect(s.isLoading).toBe(false);
    expect(s.saveState).toBe("gespeichert");
    expect(s.errorMessage).toBeNull();
  });

  it("addContainer legt Container an und markiert ungespeichert", () => {
    workspaceStore.addContainer("tool-a");
    const s = get(workspaceStore);
    expect(s.workspace?.container).toHaveLength(1);
    expect(s.workspace?.container[0]).toMatchObject({
      toolId: "tool-a",
      x: 0,
      y: 0,
      breite: 2,
      hoehe: 2,
    });
    expect(s.saveState).toBe("ungespeichert");
  });

  it("addContainer findet naechste freie Zelle", () => {
    workspaceStore.addContainer("tool-a");
    workspaceStore.addContainer("tool-b");
    const s = get(workspaceStore);
    expect(s.workspace?.container).toHaveLength(2);
    expect(s.workspace?.container[1].x).toBe(2);
    expect(s.workspace?.container[1].y).toBe(0);
  });

  it("moveContainer verschiebt, blockiert am Rand und bei Kollision", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.moveContainer(id, 3, 2);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ x: 3, y: 2 });
    workspaceStore.moveContainer(id, -99, 0);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ x: 3, y: 2 });
    workspaceStore.moveContainer(id, 99, 0);
    expect(get(workspaceStore).workspace!.container[0].x).toBe(3);
  });

  it("moveContainer blockiert, wenn Zielposition von anderem Container belegt ist", () => {
    workspaceStore.addContainer("tool-a");
    workspaceStore.addContainer("tool-b");
    const [a, b] = get(workspaceStore).workspace!.container;
    workspaceStore.moveContainer(a.id, 1, 0);
    const after = get(workspaceStore).workspace!.container.find((c) => c.id === a.id)!;
    expect(after).toMatchObject({ x: a.x, y: a.y });
    expect(get(workspaceStore).workspace!.container.find((c) => c.id === b.id)).toMatchObject({ x: b.x, y: b.y });
  });

  it("resizeContainer blockiert bei Ueberlappung und bei ungueltiger Groesse", () => {
    workspaceStore.addContainer("tool-a");
    workspaceStore.addContainer("tool-b");
    const [a] = get(workspaceStore).workspace!.container;
    workspaceStore.resizeContainer(a.id, 1, 0);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ breite: 2, hoehe: 2 });
    workspaceStore.resizeContainer(a.id, -5, -5);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ breite: 2, hoehe: 2 });
  });

  it("selectContainer nur im Editor-Modus, clearSelection leert", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.setEditor(false);
    workspaceStore.selectContainer(id);
    expect(get(workspaceStore).selectedContainerId).toBeNull();
    workspaceStore.setEditor(true);
    workspaceStore.selectContainer(id);
    expect(get(workspaceStore).selectedContainerId).toBe(id);
    workspaceStore.clearSelection();
    expect(get(workspaceStore).selectedContainerId).toBeNull();
  });

  it("setEditor(false) leert Selection", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.selectContainer(id);
    workspaceStore.setEditor(false);
    expect(get(workspaceStore).selectedContainerId).toBeNull();
  });

  it("renameContainer setzt titel, leer entfernt ihn", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.renameContainer(id, "Notizen");
    expect(get(workspaceStore).workspace!.container[0].titel).toBe("Notizen");
    expect(get(workspaceStore).saveState).toBe("ungespeichert");
    workspaceStore.renameContainer(id, "   ");
    expect(get(workspaceStore).workspace!.container[0].titel).toBeUndefined();
  });

  it("changeContainerTool aendert nur toolId, Position bleibt gleich", () => {
    workspaceStore.addContainer("tool-a");
    const before = get(workspaceStore).workspace!.container[0];
    workspaceStore.changeContainerTool(before.id, "tool-b");
    const after = get(workspaceStore).workspace!.container[0];
    expect(after.toolId).toBe("tool-b");
    expect(after).toMatchObject({ x: before.x, y: before.y, breite: before.breite, hoehe: before.hoehe });
    expect(get(workspaceStore).saveState).toBe("ungespeichert");
  });

  it("removeContainer entfernt Container und leert Auswahl wenn betroffen", () => {
    workspaceStore.addContainer("tool-a");
    workspaceStore.addContainer("tool-b");
    const [a, b] = get(workspaceStore).workspace!.container;
    workspaceStore.selectContainer(a.id);
    workspaceStore.removeContainer(a.id);
    const s = get(workspaceStore);
    expect(s.workspace!.container).toHaveLength(1);
    expect(s.workspace!.container[0].id).toBe(b.id);
    expect(s.selectedContainerId).toBeNull();
    expect(s.saveState).toBe("ungespeichert");
  });

  it("saveNow durchlaeuft speichert -> gespeichert", async () => {
    workspaceStore.addContainer("tool-a");
    expect(get(workspaceStore).saveState).toBe("ungespeichert");
    await workspaceStore.saveNow();
    expect(get(workspaceStore).saveState).toBe("gespeichert");
    expect(get(workspaceStore).errorMessage).toBeNull();
  });

  it("saveNow setzt saveState=fehler und errorMessage bei PUT-Fehler", async () => {
    mockFetch(seed, tools, {
      onPut: async () => new Response("server down", { status: 500 }),
    });
    await workspaceStore.loadInitial();
    workspaceStore.setEditor(true);
    workspaceStore.addContainer("tool-a");
    await workspaceStore.saveNow();
    const s = get(workspaceStore);
    expect(s.saveState).toBe("fehler");
    expect(s.errorMessage).toBeTruthy();
  });

  it("toggleEditor wechselt editor-Flag und leert Selection beim Ausschalten", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.selectContainer(id);
    workspaceStore.toggleEditor();
    expect(get(workspaceStore).editor).toBe(false);
    expect(get(workspaceStore).selectedContainerId).toBeNull();
    workspaceStore.toggleEditor();
    expect(get(workspaceStore).editor).toBe(true);
  });
});
