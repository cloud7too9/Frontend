import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem, PanelTyp, WorkspaceLayout } from "../model/workspace.types";
import { PANEL_TYPEN } from "../model/panel-registry";

const LEGACY_STORAGE_KEY = "mainhub.workspace.v1";
const STORAGE_KEY = "mainhub.workspaces.v2";
const LEGACY_SCHEMA_VERSION = 1;
const SCHEMA_VERSION = 2;

export interface WorkspacesCollection {
  activeWorkspaceId: Id;
  order: Id[];
  workspaces: Record<Id, WorkspaceLayout>;
}

interface LegacyPayload {
  version: number;
  layout: WorkspaceLayout;
}

interface CollectionPayload {
  version: number;
  activeWorkspaceId: Id;
  order: Id[];
  workspaces: Record<Id, WorkspaceLayout>;
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

function isValidCollection(raw: unknown): raw is WorkspacesCollection {
  if (!raw || typeof raw !== "object") return false;
  const c = raw as Record<string, unknown>;
  if (typeof c.activeWorkspaceId !== "string" || !c.activeWorkspaceId) return false;
  if (!Array.isArray(c.order) || c.order.length === 0) return false;
  if (!c.order.every((x) => typeof x === "string" && x.length > 0)) return false;
  if (!c.workspaces || typeof c.workspaces !== "object") return false;
  const ws = c.workspaces as Record<string, unknown>;
  const orderIds = c.order as string[];
  if (!orderIds.includes(c.activeWorkspaceId as string)) return false;
  if (orderIds.length !== Object.keys(ws).length) return false;
  for (const id of orderIds) {
    const layout = ws[id];
    if (!isValidLayout(layout)) return false;
    if (layout.id !== id) return false;
  }
  return true;
}

export function saveWorkspacesToStorage(collection: WorkspacesCollection): void {
  try {
    const payload: CollectionPayload = {
      version: SCHEMA_VERSION,
      activeWorkspaceId: collection.activeWorkspaceId,
      order: collection.order,
      workspaces: collection.workspaces,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore (quota, private mode)
  }
}

function readLegacyLayout(): WorkspaceLayout | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as Partial<LegacyPayload>;
    if (payload.version !== LEGACY_SCHEMA_VERSION) return null;
    if (!isValidLayout(payload.layout)) return null;
    return payload.layout;
  } catch {
    return null;
  }
}

function clearLegacyStorage(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadWorkspacesFromStorage(): WorkspacesCollection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const payload = parsed as Partial<CollectionPayload>;
        if (
          payload.version === SCHEMA_VERSION &&
          isValidCollection({
            activeWorkspaceId: payload.activeWorkspaceId,
            order: payload.order,
            workspaces: payload.workspaces,
          })
        ) {
          const valid = payload as CollectionPayload;
          clearLegacyStorage();
          return {
            activeWorkspaceId: valid.activeWorkspaceId,
            order: valid.order,
            workspaces: valid.workspaces,
          };
        }
      }
    }
  } catch {
    // fall through to legacy
  }

  const legacy = readLegacyLayout();
  if (legacy) {
    const migrated: WorkspacesCollection = {
      activeWorkspaceId: legacy.id,
      order: [legacy.id],
      workspaces: { [legacy.id]: legacy },
    };
    saveWorkspacesToStorage(migrated);
    clearLegacyStorage();
    return migrated;
  }

  return null;
}

export function clearWorkspacesStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
