import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Workspace } from "@mainhub/shared";
import { JsonStore } from "../src/storage/json-store.js";

async function tempFile(name: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mainhub-"));
  return path.join(dir, name);
}

describe("JsonStore", () => {
  it("schreibt und liest ein Workspace-Objekt strukturgleich", async () => {
    const file = await tempFile("workspace.json");
    const store = new JsonStore<Workspace>(file);

    const workspace: Workspace = {
      id: "ws-1",
      name: "Test",
      spalten: 12,
      zeilenHoehe: 80,
      container: [
        { id: "c1", toolId: "tool-notiz", x: 0, y: 0, breite: 2, hoehe: 2 },
      ],
    };

    await store.write(workspace);
    const read = await store.read();
    expect(read).toEqual(workspace);
  });

  it("ueberschreibt bestehende Datei atomar", async () => {
    const file = await tempFile("workspace.json");
    const store = new JsonStore<Workspace>(file);
    const base: Workspace = { id: "ws-1", name: "A", spalten: 12, zeilenHoehe: 80, container: [] };
    await store.write(base);
    await store.write({ ...base, name: "B" });
    const read = await store.read();
    expect(read.name).toBe("B");
  });
});
