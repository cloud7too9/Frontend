import { Router, type Request, type Response } from "express";
import type { Tool } from "@mainhub/shared";
import { JsonStore } from "../storage/json-store.js";

export function createToolsRouter(store: JsonStore<Tool[]>): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const tools = await store.read();
    res.json(tools);
  });

  return router;
}
