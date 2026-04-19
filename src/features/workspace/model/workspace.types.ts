export type { Container, Workspace } from "@shared/workspace.types";
export type { Tool, ToolTyp } from "@shared/tool.types";

export interface AllowedSize {
  breite: number;
  hoehe: number;
}

export const ALLOWED_SIZES: AllowedSize[] = [
  { breite: 1, hoehe: 1 },
  { breite: 2, hoehe: 1 },
  { breite: 2, hoehe: 2 },
  { breite: 3, hoehe: 2 },
  { breite: 4, hoehe: 2 },
  { breite: 4, hoehe: 3 },
  { breite: 6, hoehe: 3 },
];

export type EditMode = "normal" | "edit";
