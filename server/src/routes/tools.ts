import { Router, type Request, type Response } from "express";
import { join } from "node:path";
import type { Tool } from "../../../shared/src/index.js";
import { readJson } from "../storage/jsonFile.js";

const DATA_DIR = join(process.cwd(), "data");

export const toolsRouter = Router();

toolsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const tools = await readJson<Tool[]>(join(DATA_DIR, "tools.json"));
    res.json(tools ?? []);
  } catch (err) {
    console.error("GET tools failed", err);
    res.status(500).json({ error: "internal" });
  }
});
