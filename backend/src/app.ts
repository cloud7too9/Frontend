import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Tool, Workspace } from "@mainhub/shared";
import { JsonStore } from "./storage/json-store.js";
import { createWorkspaceRouter } from "./routes/workspace.js";
import { createToolsRouter } from "./routes/tools.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(here, "../data");

export function createApp(dataDir: string = DATA_DIR): Express {
  const workspaceStore = new JsonStore<Workspace>(path.join(dataDir, "workspace.json"));
  const toolsStore = new JsonStore<Tool[]>(path.join(dataDir, "tools.json"));

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/workspace", createWorkspaceRouter(workspaceStore));
  app.use("/api/tools", createToolsRouter(toolsStore));
  return app;
}
