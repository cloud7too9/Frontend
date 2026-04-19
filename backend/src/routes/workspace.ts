import { Router, type Request, type Response } from "express";
import type { Workspace } from "@mainhub/shared";
import { JsonStore } from "../storage/json-store.js";

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === "string" &&
    typeof w.name === "string" &&
    Number.isInteger(w.spalten) &&
    (w.spalten as number) > 0 &&
    Number.isFinite(w.zeilenHoehe) &&
    (w.zeilenHoehe as number) > 0 &&
    Array.isArray(w.container)
  );
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
