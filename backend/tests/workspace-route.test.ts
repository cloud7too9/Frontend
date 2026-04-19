import { describe, expect, it, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import type { Workspace, Tool } from "@mainhub/shared";
import { createApp } from "../src/app.js";

async function setupDataDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mainhub-api-"));
  const workspace: Workspace = {
    id: "ws-1",
    name: "Seed",
    spalten: 12,
    zeilenHoehe: 80,
    container: [],
  };
  const tools: Tool[] = [
    { id: "tool-notiz", name: "Notiz", typ: "intern", quelle: "notiz" },
  ];
  await fs.writeFile(path.join(dir, "workspace.json"), JSON.stringify(workspace));
  await fs.writeFile(path.join(dir, "tools.json"), JSON.stringify(tools));
  return dir;
}

describe("workspace route", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await setupDataDir();
  });

  it("GET /api/workspace liefert den Seed", async () => {
    const app = createApp(dir);
    const res = await request(app).get("/api/workspace");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("ws-1");
    expect(res.body.container).toEqual([]);
  });

  it("PUT /api/workspace ueberschreibt und GET liest den neuen Stand", async () => {
    const app = createApp(dir);
    const updated: Workspace = {
      id: "ws-1",
      name: "Seed",
      spalten: 12,
      zeilenHoehe: 80,
      container: [{ id: "c1", toolId: "tool-notiz", x: 1, y: 1, breite: 3, hoehe: 2 }],
    };
    const put = await request(app).put("/api/workspace").send(updated);
    expect(put.status).toBe(200);
    const get = await request(app).get("/api/workspace");
    expect(get.body.container).toHaveLength(1);
    expect(get.body.container[0]).toEqual(updated.container[0]);
  });

  it("PUT /api/workspace lehnt ungueltige Struktur ab", async () => {
    const app = createApp(dir);
    const res = await request(app).put("/api/workspace").send({ id: "x" });
    expect(res.status).toBe(400);
  });

  it("GET /api/tools liefert das Tool-Array", async () => {
    const app = createApp(dir);
    const res = await request(app).get("/api/tools");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe("tool-notiz");
  });
});
