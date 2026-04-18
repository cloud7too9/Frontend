import type { WorkspaceLayout } from "../model/workspace.types";

const STORAGE_KEY = "mainhub.workspace.v1";
const SCHEMA_VERSION = 1;

interface PersistedPayload {
  version: number;
  layout: WorkspaceLayout;
}

export function saveLayoutToStorage(layout: WorkspaceLayout): void {
  try {
    const payload: PersistedPayload = { version: SCHEMA_VERSION, layout };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore write errors (quota, private mode)
  }
}

export function loadLayoutFromStorage(): WorkspaceLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPayload;
    if (!parsed || parsed.version !== SCHEMA_VERSION) return null;
    if (!parsed.layout || !Array.isArray(parsed.layout.items)) return null;
    return parsed.layout;
  } catch {
    return null;
  }
}

export function clearLayoutStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
