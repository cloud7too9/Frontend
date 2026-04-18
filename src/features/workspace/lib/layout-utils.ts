import type { AllowedSize, LayoutItem } from "../model/workspace.types";
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
  w: number,
  h: number,
  config: GridConfig,
): PixelRect {
  const col = columnWidth(config);
  const left = x * (col + config.gap);
  const top = y * (config.rowHeight + config.gap);
  const width = w * col + (w - 1) * config.gap;
  const height = h * config.rowHeight + (h - 1) * config.gap;
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

export function clampItemToGrid(item: LayoutItem, cols: number): LayoutItem {
  const w = Math.min(item.w, cols);
  const x = clamp(item.x, 0, cols - w);
  const y = Math.max(0, item.y);
  return { ...item, x, y, w };
}

export function snapSize(w: number, h: number): AllowedSize {
  let best = ALLOWED_SIZES[0];
  let bestDist = Infinity;
  for (const size of ALLOWED_SIZES) {
    const dist = Math.abs(size.w - w) + Math.abs(size.h - h);
    if (dist < bestDist) {
      bestDist = dist;
      best = size;
    }
  }
  return best;
}

export function stepSize(
  current: { w: number; h: number },
  dim: "w" | "h",
  direction: 1 | -1,
): AllowedSize {
  const other: "w" | "h" = dim === "w" ? "h" : "w";
  const candidates = ALLOWED_SIZES.filter((s) =>
    direction > 0 ? s[dim] > current[dim] : s[dim] < current[dim],
  );
  if (candidates.length === 0) return { w: current.w, h: current.h };
  candidates.sort((a, b) => {
    const pa = Math.abs(a[dim] - current[dim]);
    const pb = Math.abs(b[dim] - current[dim]);
    if (pa !== pb) return pa - pb;
    return Math.abs(a[other] - current[other]) - Math.abs(b[other] - current[other]);
  });
  return candidates[0];
}

export function gridRowCount(items: LayoutItem[], minRows = 6): number {
  const max = items.reduce((acc, it) => Math.max(acc, it.y + it.h), 0);
  return Math.max(minRows, max + 2);
}

export function findFreePosition(
  items: LayoutItem[],
  w: number,
  h: number,
  cols: number,
): { x: number; y: number } {
  const maxY = gridRowCount(items) + h;
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x + w <= cols; x++) {
      const candidate = { x, y, w, h };
      const collides = items.some((it) => rectsOverlap(candidate, it));
      if (!collides) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
