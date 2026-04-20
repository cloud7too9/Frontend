import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem, PanelTyp, WorkspaceLayout } from "./workspace.types";
import { PANEL_REGISTRY } from "./panel-registry";

export interface WorkspaceTemplate {
  id: string;
  name: string;
  beschreibung: string;
  createLayout: (id: Id, name: string) => WorkspaceLayout;
}

type PanelSpec = {
  panelTyp: PanelTyp;
  x: number;
  y: number;
  w: number;
  h: number;
  titel?: string;
};

function buildLayout(id: Id, name: string, panels: PanelSpec[]): WorkspaceLayout {
  const items: LayoutItem[] = panels.map((p, idx) => ({
    id: `item-${id}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    panelTyp: p.panelTyp,
    titel: p.titel ?? PANEL_REGISTRY[p.panelTyp].standardTitel,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
  }));
  return {
    id,
    name,
    spalten: 12,
    zeilenHoehe: 80,
    abstand: 12,
    items,
  };
}

export const DEFAULT_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "tpl-start",
    name: "Start",
    beschreibung: "Übersicht mit den wichtigsten Panels.",
    createLayout: (id, name) =>
      buildLayout(id, name, [
        { panelTyp: "schnellnotiz", x: 0, y: 0, w: 3, h: 2 },
        { panelTyp: "aufgaben", x: 3, y: 0, w: 3, h: 2 },
        { panelTyp: "projektstatus", x: 6, y: 0, w: 4, h: 2 },
        { panelTyp: "toolstart", x: 10, y: 0, w: 2, h: 2 },
        { panelTyp: "dateien", x: 0, y: 2, w: 4, h: 2 },
        { panelTyp: "letzteInhalte", x: 4, y: 2, w: 4, h: 2 },
      ]),
  },
  {
    id: "tpl-entwicklung",
    name: "Entwicklung",
    beschreibung: "Status, Tasks und Tools für aktive Projektarbeit.",
    createLayout: (id, name) =>
      buildLayout(id, name, [
        { panelTyp: "projektstatus", x: 0, y: 0, w: 6, h: 3 },
        { panelTyp: "aufgaben", x: 6, y: 0, w: 3, h: 3 },
        { panelTyp: "toolstart", x: 9, y: 0, w: 3, h: 2 },
        { panelTyp: "dateien", x: 0, y: 3, w: 6, h: 2 },
        { panelTyp: "schnellnotiz", x: 6, y: 3, w: 6, h: 2 },
      ]),
  },
  {
    id: "tpl-inhalte",
    name: "Inhalte",
    beschreibung: "Letzte Aktivitäten und Dateien im Fokus.",
    createLayout: (id, name) =>
      buildLayout(id, name, [
        { panelTyp: "letzteInhalte", x: 0, y: 0, w: 8, h: 3 },
        { panelTyp: "dateien", x: 8, y: 0, w: 4, h: 3 },
        { panelTyp: "schnellnotiz", x: 0, y: 3, w: 6, h: 2 },
        { panelTyp: "aufgaben", x: 6, y: 3, w: 6, h: 2 },
      ]),
  },
  {
    id: "tpl-ideen",
    name: "Ideen",
    beschreibung: "Viel Platz für Notizen und lose Aufgaben.",
    createLayout: (id, name) =>
      buildLayout(id, name, [
        { panelTyp: "schnellnotiz", x: 0, y: 0, w: 6, h: 3, titel: "Schnellnotiz – Skizze" },
        { panelTyp: "schnellnotiz", x: 6, y: 0, w: 6, h: 3, titel: "Schnellnotiz – Details" },
        { panelTyp: "aufgaben", x: 0, y: 3, w: 4, h: 2 },
        { panelTyp: "letzteInhalte", x: 4, y: 3, w: 8, h: 2 },
      ]),
  },
  {
    id: "tpl-analyse",
    name: "Analyse",
    beschreibung: "Status und Verlauf für Reviews und Auswertung.",
    createLayout: (id, name) =>
      buildLayout(id, name, [
        { panelTyp: "projektstatus", x: 0, y: 0, w: 8, h: 3 },
        { panelTyp: "letzteInhalte", x: 8, y: 0, w: 4, h: 3 },
        { panelTyp: "dateien", x: 0, y: 3, w: 6, h: 2 },
        { panelTyp: "aufgaben", x: 6, y: 3, w: 6, h: 2 },
      ]),
  },
];

export function getTemplate(id: string): WorkspaceTemplate | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.id === id);
}

export const START_TEMPLATE_ID = "tpl-start";
