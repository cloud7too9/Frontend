import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWorkspacesStorage,
  isValidLayout,
  loadWorkspacesFromStorage,
  saveWorkspacesToStorage,
  type WorkspacesCollection,
} from "../features/workspace/lib/storage";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import type { WorkspaceLayout } from "../features/workspace/model/workspace.types";

const V2_KEY = "mainhub.workspaces.v2";
const V1_KEY = "mainhub.workspace.v1";

function singleCollection(layout: WorkspaceLayout = DEFAULT_LAYOUT): WorkspacesCollection {
  return {
    activeWorkspaceId: layout.id,
    order: [layout.id],
    workspaces: { [layout.id]: layout },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("v2 storage roundtrip", () => {
  it("returns null when no data is stored", () => {
    expect(loadWorkspacesFromStorage()).toBeNull();
  });

  it("roundtrips a collection through save/load", () => {
    saveWorkspacesToStorage(singleCollection());
    const loaded = loadWorkspacesFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.activeWorkspaceId).toBe(DEFAULT_LAYOUT.id);
    expect(loaded!.order).toEqual([DEFAULT_LAYOUT.id]);
    expect(loaded!.workspaces[DEFAULT_LAYOUT.id].items.length).toBe(DEFAULT_LAYOUT.items.length);
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem(V2_KEY, "{not valid json");
    expect(loadWorkspacesFromStorage()).toBeNull();
  });

  it("returns null on wrong version", () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({ version: 999, ...singleCollection() }),
    );
    expect(loadWorkspacesFromStorage()).toBeNull();
  });

  it("returns null when activeWorkspaceId is unknown", () => {
    const c = singleCollection();
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({ version: 2, ...c, activeWorkspaceId: "ghost" }),
    );
    expect(loadWorkspacesFromStorage()).toBeNull();
  });

  it("returns null when order has duplicates or mismatched length", () => {
    const c = singleCollection();
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        version: 2,
        activeWorkspaceId: c.activeWorkspaceId,
        order: [c.activeWorkspaceId, "stray"],
        workspaces: c.workspaces,
      }),
    );
    expect(loadWorkspacesFromStorage()).toBeNull();
  });

  it("clears stored data", () => {
    saveWorkspacesToStorage(singleCollection());
    clearWorkspacesStorage();
    expect(loadWorkspacesFromStorage()).toBeNull();
  });
});

describe("isValidLayout edge cases", () => {
  it("rejects non-numeric item coordinates", () => {
    const broken = {
      ...DEFAULT_LAYOUT,
      items: DEFAULT_LAYOUT.items.map((i, idx) =>
        idx === 0 ? { ...i, x: "abc" as unknown as number } : i,
      ),
    };
    expect(isValidLayout(broken)).toBe(false);
  });

  it("rejects an unknown panel type", () => {
    const broken = {
      ...DEFAULT_LAYOUT,
      items: DEFAULT_LAYOUT.items.map((i, idx) =>
        idx === 0 ? { ...i, panelTyp: "unknown" as never } : i,
      ),
    };
    expect(isValidLayout(broken)).toBe(false);
  });

  it("rejects a layout where an item overflows the grid (x+w > spalten)", () => {
    const broken = {
      ...DEFAULT_LAYOUT,
      items: [{ ...DEFAULT_LAYOUT.items[0], x: 10, w: 5 }],
    };
    expect(isValidLayout(broken)).toBe(false);
  });

  it("rejects non-positive grid params", () => {
    const broken = { ...DEFAULT_LAYOUT, zeilenHoehe: 0 };
    expect(isValidLayout(broken)).toBe(false);
  });
});

describe("v1 → v2 migration", () => {
  it("migrates a valid v1 payload into a single-workspace collection", () => {
    localStorage.setItem(
      V1_KEY,
      JSON.stringify({ version: 1, layout: DEFAULT_LAYOUT }),
    );
    const loaded = loadWorkspacesFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.activeWorkspaceId).toBe(DEFAULT_LAYOUT.id);
    expect(loaded!.order).toEqual([DEFAULT_LAYOUT.id]);
    expect(loaded!.workspaces[DEFAULT_LAYOUT.id].items.length).toBe(
      DEFAULT_LAYOUT.items.length,
    );
  });

  it("removes the legacy key after migration", () => {
    localStorage.setItem(
      V1_KEY,
      JSON.stringify({ version: 1, layout: DEFAULT_LAYOUT }),
    );
    loadWorkspacesFromStorage();
    expect(localStorage.getItem(V1_KEY)).toBeNull();
    expect(localStorage.getItem(V2_KEY)).not.toBeNull();
  });

  it("prefers v2 when both keys exist and leaves v1 key untouched", () => {
    saveWorkspacesToStorage(singleCollection());
    localStorage.setItem(V1_KEY, JSON.stringify({ version: 1, layout: DEFAULT_LAYOUT }));
    const loaded = loadWorkspacesFromStorage();
    expect(loaded).not.toBeNull();
    expect(localStorage.getItem(V1_KEY)).toBeNull();
  });

  it("returns null when v1 payload is invalid and no v2 exists", () => {
    localStorage.setItem(V1_KEY, JSON.stringify({ version: 1, layout: { bad: true } }));
    expect(loadWorkspacesFromStorage()).toBeNull();
  });
});
