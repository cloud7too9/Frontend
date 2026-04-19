import type { Tool, Workspace } from "@mainhub/shared";

export async function getWorkspace(): Promise<Workspace> {
  const res = await fetch("/api/workspace");
  if (!res.ok) throw new Error(`GET /api/workspace: ${res.status}`);
  return res.json();
}

export async function putWorkspace(workspace: Workspace): Promise<Workspace> {
  const res = await fetch("/api/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workspace),
  });
  if (!res.ok) throw new Error(`PUT /api/workspace: ${res.status}`);
  return res.json();
}

export async function getTools(): Promise<Tool[]> {
  const res = await fetch("/api/tools");
  if (!res.ok) throw new Error(`GET /api/tools: ${res.status}`);
  return res.json();
}
