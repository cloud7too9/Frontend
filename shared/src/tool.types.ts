export type ToolTyp = "intern" | "extern";

export interface Tool {
  id: string;
  name: string;
  typ: ToolTyp;
  quelle: string;
  standardBreite?: number;
  standardHoehe?: number;
  minBreite?: number;
  minHoehe?: number;
  erlaubtResize?: boolean;
}
