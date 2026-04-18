import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLayoutStorage,
  loadLayoutFromStorage,
  saveLayoutToStorage,
} from "../features/workspace/lib/storage";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import type { WorkspaceLayout } from "../features/workspace/model/workspace.types";

beforeEach(() => {
  localStorage.clear();
});

describe("layout storage", () => {
  it("returns null when no data is stored", () => {
    expect(loadLayoutFromStorage()).toBeNull();
  });

  it("roundtrips a layout through save/load", () => {
    saveLayoutToStorage(DEFAULT_LAYOUT);
    const loaded = loadLayoutFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.items.length).toBe(DEFAULT_LAYOUT.items.length);
    expect(loaded!.id).toBe(DEFAULT_LAYOUT.id);
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem("mainhub.workspace.v1", "{not valid json");
    expect(loadLayoutFromStorage()).toBeNull();
  });

  it("returns null on missing version", () => {
    localStorage.setItem(
      "mainhub.workspace.v1",
      JSON.stringify({ layout: DEFAULT_LAYOUT }),
    );
    expect(loadLayoutFromStorage()).toBeNull();
  });

  it("returns null on wrong version", () => {
    localStorage.setItem(
      "mainhub.workspace.v1",
      JSON.stringify({ version: 999, layout: DEFAULT_LAYOUT }),
    );
    expect(loadLayoutFromStorage()).toBeNull();
  });

  it("returns null when layout shape is broken", () => {
    localStorage.setItem(
      "mainhub.workspace.v1",
      JSON.stringify({ version: 1, layout: { id: "x" } as WorkspaceLayout }),
    );
    expect(loadLayoutFromStorage()).toBeNull();
  });

  it("clears stored data", () => {
    saveLayoutToStorage(DEFAULT_LAYOUT);
    clearLayoutStorage();
    expect(loadLayoutFromStorage()).toBeNull();
  });
});
