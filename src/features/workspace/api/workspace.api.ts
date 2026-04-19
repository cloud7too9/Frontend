import type { Tool, Workspace } from "../model/workspace.types";

const BASE = "/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${url} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchWorkspace(id: string): Promise<Workspace> {
  return request<Workspace>(`${BASE}/workspaces/${id}`);
}

export function saveWorkspace(workspace: Workspace): Promise<Workspace> {
  return request<Workspace>(`${BASE}/workspaces/${workspace.id}`, {
    method: "PUT",
    body: JSON.stringify(workspace),
  });
}

export function fetchTools(): Promise<Tool[]> {
  return request<Tool[]>(`${BASE}/tools`);
}
