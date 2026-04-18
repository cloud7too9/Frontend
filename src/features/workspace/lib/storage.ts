import type { LayoutItem, PanelTyp, WorkspaceLayout } from "../model/workspace.types";
import { PANEL_TYPEN } from "../model/panel-registry";

const STORAGE_KEY = "mainhub.workspace.v1";
const SCHEMA_VERSION = 1;

interface PersistedPayload {
  version: number;
  layout: WorkspaceLayout;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonNegativeInt(v: unknown): v is number {
  return isFiniteNumber(v) && Number.isInteger(v) && v >= 0;
}

function isPositiveInt(v: unknown): v is number {
  return isFiniteNumber(v) && Number.isInteger(v) && v > 0;
}

function isPanelTyp(v: unknown): v is PanelTyp {
  return typeof v === "string" && (PANEL_TYPEN as string[]).includes(v);
}

function isValidItem(raw: unknown, cols: number): raw is LayoutItem {
  if (!raw || typeof raw !== "object") return false;
  const i = raw as Record<string, unknown>;
  if (typeof i.id !== "string" || !i.id) return false;
  if (typeof i.titel !== "string") return false;
  if (!isPanelTyp(i.panelTyp)) return false;
  if (!isNonNegativeInt(i.x) || !isNonNegativeInt(i.y)) return false;
  if (!isPositiveInt(i.w) || !isPositiveInt(i.h)) return false;
  if (i.x + i.w > cols) return false;
  for (const key of ["minW", "minH", "maxW", "maxH"] as const) {
    if (i[key] !== undefined && !isPositiveInt(i[key])) return false;
  }
  return true;
}

export function isValidLayout(raw: unknown): raw is WorkspaceLayout {
  if (!raw || typeof raw !== "object") return false;
  const l = raw as Record<string, unknown>;
  if (typeof l.id !== "string" || !l.id) return false;
  if (typeof l.name !== "string") return false;
  if (!isPositiveInt(l.spalten)) return false;
  if (!isFiniteNumber(l.zeilenHoehe) || l.zeilenHoehe <= 0) return false;
  if (!isFiniteNumber(l.abstand) || l.abstand < 0) return false;
  if (!Array.isArray(l.items)) return false;
  return l.items.every((it) => isValidItem(it, l.spalten as number));
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
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as Partial<PersistedPayload>;
    if (payload.version !== SCHEMA_VERSION) return null;
    if (!isValidLayout(payload.layout)) return null;
    return payload.layout;
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
