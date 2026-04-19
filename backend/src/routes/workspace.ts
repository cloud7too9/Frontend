import { Router, type Request, type Response } from "express";
import type { Workspace } from "@mainhub/shared";
import { JsonStore } from "../storage/json-store.js";

function isContainer(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.toolId !== "string") return false;
  if (c.titel !== undefined && typeof c.titel !== "string") return false;
  for (const key of ["x", "y", "breite", "hoehe"] as const) {
    if (typeof c[key] !== "number" || !Number.isFinite(c[key] as number)) return false;
  }
  if ((c.x as number) < 0 || (c.y as number) < 0) return false;
  if ((c.breite as number) < 1 || (c.hoehe as number) < 1) return false;
  return true;
}

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const w = value as Record<string, unknown>;
  if (
    typeof w.id !== "string" ||
    typeof w.name !== "string" ||
    !Number.isInteger(w.spalten) ||
    (w.spalten as number) <= 0 ||
    !Number.isFinite(w.zeilenHoehe) ||
    (w.zeilenHoehe as number) <= 0 ||
    !Array.isArray(w.container)
  ) {
    return false;
  }
  return (w.container as unknown[]).every(isContainer);
}

export function createWorkspaceRouter(store: JsonStore<Workspace>): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const workspace = await store.read();
    res.json(workspace);
  });

  router.put("/", async (req: Request, res: Response) => {
    if (!isWorkspace(req.body)) {
      res.status(400).json({ error: "Ungueltiger Workspace-Body" });
      return;
    }
    await store.write(req.body);
    res.json(req.body);
  });

  return router;
}
