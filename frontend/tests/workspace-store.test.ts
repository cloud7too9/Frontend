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

function mockFetch(workspace: Workspace, toolList: Tool[]) {
  let current = structuredClone(workspace);
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/workspace") && (!init || init.method === undefined || init.method === "GET")) {
      return new Response(JSON.stringify(current), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.endsWith("/api/workspace") && init?.method === "PUT") {
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

  it("loadInitial holt Workspace und Tools", () => {
    const s = get(workspaceStore);
    expect(s.workspace?.id).toBe("ws-1");
    expect(s.tools).toHaveLength(2);
  });

  it("addContainer legt Container mit Tool an freier Position an", () => {
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
    expect(s.status).toBe("dirty");
  });

  it("addContainer findet naechste freie Zelle", () => {
    workspaceStore.addContainer("tool-a");
    workspaceStore.addContainer("tool-b");
    const s = get(workspaceStore);
    expect(s.workspace?.container).toHaveLength(2);
    expect(s.workspace?.container[1].x).toBe(2);
    expect(s.workspace?.container[1].y).toBe(0);
  });

  it("moveContainer verschiebt und clamped an Grenzen", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.moveContainer(id, 3, 2);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ x: 3, y: 2 });
    workspaceStore.moveContainer(id, -10, -10);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ x: 0, y: 0 });
    workspaceStore.moveContainer(id, 99, 0);
    expect(get(workspaceStore).workspace!.container[0].x).toBe(10);
  });

  it("resizeContainer erzwingt min 1 und passt an Spalten an", () => {
    workspaceStore.addContainer("tool-a");
    const id = get(workspaceStore).workspace!.container[0].id;
    workspaceStore.resizeContainer(id, 3, 1);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ breite: 5, hoehe: 3 });
    workspaceStore.resizeContainer(id, -10, -10);
    expect(get(workspaceStore).workspace!.container[0]).toMatchObject({ breite: 1, hoehe: 1 });
  });

  it("saveNow ruft PUT und setzt status auf saved", async () => {
    workspaceStore.addContainer("tool-a");
    await workspaceStore.saveNow();
    const s = get(workspaceStore);
    expect(s.status).toBe("saved");
    expect(s.workspace?.container).toHaveLength(1);
  });

  it("toggleEditor wechselt editor-Flag", () => {
    workspaceStore.setEditor(false);
    expect(get(workspaceStore).editor).toBe(false);
    workspaceStore.toggleEditor();
    expect(get(workspaceStore).editor).toBe(true);
  });
});
