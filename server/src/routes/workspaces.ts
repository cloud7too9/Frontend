import { Router, type Request, type Response } from "express";
import { join } from "node:path";
import { z } from "zod";
import type { Workspace } from "../../../shared/src/index.js";
import { readJson, writeJsonAtomic } from "../storage/jsonFile.js";

const DATA_DIR = join(process.cwd(), "data");

const ContainerSchema = z.object({
  id: z.string().min(1),
  toolId: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  breite: z.number().int().positive(),
  hoehe: z.number().int().positive(),
});

const WorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  spalten: z.number().int().positive(),
  zeilenHoehe: z.number().positive(),
  container: z.array(ContainerSchema),
});

function filePathFor(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) throw new Error("Invalid workspace id");
  return join(DATA_DIR, `workspace-${safe}.json`);
}

export const workspacesRouter = Router();

workspacesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const path = filePathFor(req.params.id);
    const data = await readJson<Workspace>(path);
    if (!data) {
      res.status(404).json({ error: "workspace_not_found" });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("GET workspace failed", err);
    res.status(500).json({ error: "internal" });
  }
});

workspacesRouter.put("/:id", async (req: Request, res: Response) => {
  const parsed = WorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  if (parsed.data.id !== req.params.id) {
    res.status(400).json({ error: "id_mismatch" });
    return;
  }
  try {
    await writeJsonAtomic(filePathFor(req.params.id), parsed.data);
    res.json(parsed.data);
  } catch (err) {
    console.error("PUT workspace failed", err);
    res.status(500).json({ error: "internal" });
  }
});
