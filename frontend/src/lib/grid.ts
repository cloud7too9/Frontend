import type { Container, Workspace } from "@mainhub/shared";

export const GAP_PX = 8;

export interface GridMetrics {
  spalten: number;
  zeilenHoehe: number;
  spaltenBreite: number;
  gap: number;
}

export function metricsFor(workspace: Workspace, containerWidthPx: number): GridMetrics {
  const gap = GAP_PX;
  const spaltenBreite = Math.max(
    40,
    (containerWidthPx - gap * (workspace.spalten + 1)) / workspace.spalten
  );
  return {
    spalten: workspace.spalten,
    zeilenHoehe: workspace.zeilenHoehe,
    spaltenBreite,
    gap,
  };
}

export function cellToPixel(
  x: number,
  y: number,
  breite: number,
  hoehe: number,
  m: GridMetrics
): { left: number; top: number; width: number; height: number } {
  const left = m.gap + x * (m.spaltenBreite + m.gap);
  const top = m.gap + y * (m.zeilenHoehe + m.gap);
  const width = breite * m.spaltenBreite + (breite - 1) * m.gap;
  const height = hoehe * m.zeilenHoehe + (hoehe - 1) * m.gap;
  return { left, top, width, height };
}

export function pixelDeltaToCells(dx: number, dy: number, m: GridMetrics): { dxCells: number; dyCells: number } {
  const stepX = m.spaltenBreite + m.gap;
  const stepY = m.zeilenHoehe + m.gap;
  return {
    dxCells: Math.round(dx / stepX),
    dyCells: Math.round(dy / stepY),
  };
}

export function clampPosition(
  c: Container,
  spalten: number
): Container {
  const x = Math.max(0, Math.min(c.x, spalten - c.breite));
  const y = Math.max(0, c.y);
  return { ...c, x, y };
}

export function clampSize(c: Container, spalten: number): Container {
  const breite = Math.max(1, Math.min(c.breite, spalten - c.x));
  const hoehe = Math.max(1, c.hoehe);
  return { ...c, breite, hoehe };
}

export function overlaps(a: Container, b: Container): boolean {
  return (
    a.x < b.x + b.breite &&
    a.x + a.breite > b.x &&
    a.y < b.y + b.hoehe &&
    a.y + a.hoehe > b.y
  );
}

export function findFreeSpot(
  container: Container[],
  spalten: number,
  breite: number,
  hoehe: number,
  maxZeilen: number = 100
): { x: number; y: number } {
  for (let y = 0; y < maxZeilen; y++) {
    for (let x = 0; x <= spalten - breite; x++) {
      const candidate: Container = { id: "_", toolId: "_", x, y, breite, hoehe };
      if (!container.some((c) => overlaps(candidate, c))) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: maxZeilen };
}

export function gridHeightRows(container: Container[], min: number = 6): number {
  const deepest = container.reduce((max, c) => Math.max(max, c.y + c.hoehe), 0);
  return Math.max(min, deepest + 1);
}
