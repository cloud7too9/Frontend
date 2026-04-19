import type { AllowedSize, Container } from "../model/workspace.types";
import { ALLOWED_SIZES } from "../model/workspace.types";

export interface GridConfig {
  cols: number;
  rowHeight: number;
  gap: number;
  containerWidth: number;
}

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function columnWidth(config: GridConfig): number {
  const { cols, gap, containerWidth } = config;
  const totalGap = gap * (cols - 1);
  return Math.max(0, (containerWidth - totalGap) / cols);
}

export function cellToPixel(
  x: number,
  y: number,
  breite: number,
  hoehe: number,
  config: GridConfig,
): PixelRect {
  const col = columnWidth(config);
  const left = x * (col + config.gap);
  const top = y * (config.rowHeight + config.gap);
  const width = breite * col + (breite - 1) * config.gap;
  const height = hoehe * config.rowHeight + (hoehe - 1) * config.gap;
  return { left, top, width, height };
}

export function pixelToCell(
  px: number,
  py: number,
  config: GridConfig,
): { x: number; y: number } {
  const col = columnWidth(config);
  const x = Math.round(px / (col + config.gap));
  const y = Math.round(py / (config.rowHeight + config.gap));
  return {
    x: clamp(x, 0, config.cols - 1),
    y: Math.max(0, y),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampContainerToGrid(container: Container, cols: number): Container {
  const breite = Math.min(container.breite, cols);
  const x = clamp(container.x, 0, cols - breite);
  const y = Math.max(0, container.y);
  return { ...container, x, y, breite };
}

export function snapSize(breite: number, hoehe: number): AllowedSize {
  let best = ALLOWED_SIZES[0];
  let bestDist = Infinity;
  for (const size of ALLOWED_SIZES) {
    const dist = Math.abs(size.breite - breite) + Math.abs(size.hoehe - hoehe);
    if (dist < bestDist) {
      bestDist = dist;
      best = size;
    }
  }
  return best;
}

export function stepSize(
  current: { breite: number; hoehe: number },
  dim: "breite" | "hoehe",
  direction: 1 | -1,
): AllowedSize {
  const other: "breite" | "hoehe" = dim === "breite" ? "hoehe" : "breite";
  const candidates = ALLOWED_SIZES.filter((s) =>
    direction > 0 ? s[dim] > current[dim] : s[dim] < current[dim],
  );
  if (candidates.length === 0) return { breite: current.breite, hoehe: current.hoehe };
  candidates.sort((a, b) => {
    const pa = Math.abs(a[dim] - current[dim]);
    const pb = Math.abs(b[dim] - current[dim]);
    if (pa !== pb) return pa - pb;
    return Math.abs(a[other] - current[other]) - Math.abs(b[other] - current[other]);
  });
  return candidates[0];
}

export function gridRowCount(container: Container[], minRows = 6): number {
  const max = container.reduce((acc, it) => Math.max(acc, it.y + it.hoehe), 0);
  return Math.max(minRows, max + 2);
}

export function findFreePosition(
  container: Container[],
  breite: number,
  hoehe: number,
  cols: number,
): { x: number; y: number } {
  const maxY = gridRowCount(container) + hoehe;
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x + breite <= cols; x++) {
      const candidate = { x, y, breite, hoehe };
      const collides = container.some((it) => rectsOverlap(candidate, it));
      if (!collides) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

export interface Rect {
  x: number;
  y: number;
  breite: number;
  hoehe: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.breite &&
    a.x + a.breite > b.x &&
    a.y < b.y + b.hoehe &&
    a.y + a.hoehe > b.y
  );
}
