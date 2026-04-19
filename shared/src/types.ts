export type ToolTyp = "intern" | "extern";

export interface Tool {
  id: string;
  name: string;
  typ: ToolTyp;
  quelle: string;
}

export interface Container {
  id: string;
  toolId: string;
  x: number;
  y: number;
  breite: number;
  hoehe: number;
}

export interface Workspace {
  id: string;
  name: string;
  spalten: number;
  zeilenHoehe: number;
  container: Container[];
}
