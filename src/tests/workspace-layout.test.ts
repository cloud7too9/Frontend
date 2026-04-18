import { describe, expect, it } from "vitest";
import {
  cellToPixel,
  clampItemToGrid,
  columnWidth,
  findFreePosition,
  pixelToCell,
  rectsOverlap,
  snapSize,
} from "../features/workspace/lib/layout-utils";
import { hasCollision } from "../features/workspace/lib/collision-utils";
import type { LayoutItem } from "../features/workspace/model/workspace.types";

const baseConfig = { cols: 12, rowHeight: 80, gap: 12, containerWidth: 1200 };

const mkItem = (overrides: Partial<LayoutItem>): LayoutItem => ({
  id: "x",
  panelTyp: "schnellnotiz",
  titel: "x",
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  ...overrides,
});

describe("columnWidth", () => {
  it("accounts for gaps between columns", () => {
    const w = columnWidth(baseConfig);
    expect(w).toBeCloseTo((1200 - 11 * 12) / 12, 5);
  });
});

describe("cellToPixel", () => {
  it("positions a 1x1 at origin", () => {
    const rect = cellToPixel(0, 0, 1, 1, baseConfig);
    expect(rect.left).toBe(0);
    expect(rect.top).toBe(0);
    expect(rect.height).toBe(80);
  });

  it("adds gap between cells", () => {
    const col = columnWidth(baseConfig);
    const rect = cellToPixel(1, 0, 1, 1, baseConfig);
    expect(rect.left).toBeCloseTo(col + 12, 5);
  });

  it("spans multiple cells with internal gaps", () => {
    const col = columnWidth(baseConfig);
    const rect = cellToPixel(0, 0, 3, 2, baseConfig);
    expect(rect.width).toBeCloseTo(3 * col + 2 * 12, 5);
    expect(rect.height).toBe(2 * 80 + 12);
  });
});

describe("pixelToCell", () => {
  it("is the inverse of cellToPixel for axis-aligned positions", () => {
    const rect = cellToPixel(4, 2, 1, 1, baseConfig);
    const cell = pixelToCell(rect.left, rect.top, baseConfig);
    expect(cell).toEqual({ x: 4, y: 2 });
  });

  it("clamps x within the grid", () => {
    const cell = pixelToCell(999999, 0, baseConfig);
    expect(cell.x).toBe(baseConfig.cols - 1);
  });
});

describe("clampItemToGrid", () => {
  it("prevents overflow on the right", () => {
    const clamped = clampItemToGrid(mkItem({ x: 11, w: 4 }), 12);
    expect(clamped.x + clamped.w).toBeLessThanOrEqual(12);
  });

  it("truncates width larger than grid", () => {
    const clamped = clampItemToGrid(mkItem({ x: 0, w: 20 }), 12);
    expect(clamped.w).toBe(12);
  });
});

describe("snapSize", () => {
  it("snaps arbitrary size to nearest allowed", () => {
    const snapped = snapSize(3.4, 1.9);
    expect(snapped).toEqual({ w: 3, h: 2 });
  });

  it("returns a size from the allowed list", () => {
    const snapped = snapSize(5, 3);
    expect([
      { w: 4, h: 3 },
      { w: 6, h: 3 },
      { w: 4, h: 2 },
    ]).toContainEqual(snapped);
  });
});

describe("rectsOverlap / hasCollision", () => {
  it("detects overlap", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 })).toBe(true);
  });

  it("ignores adjacent rects", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 2, h: 2 })).toBe(false);
  });

  it("ignores the same item (by id) when checking collisions", () => {
    const a = mkItem({ id: "a", x: 0, y: 0, w: 2, h: 2 });
    const b = mkItem({ id: "b", x: 5, y: 0, w: 2, h: 2 });
    expect(hasCollision(a, [a, b])).toBe(false);
  });
});

describe("findFreePosition", () => {
  it("places the first panel at origin", () => {
    expect(findFreePosition([], 2, 2, 12)).toEqual({ x: 0, y: 0 });
  });

  it("finds a spot next to an existing panel", () => {
    const existing = [mkItem({ id: "a", x: 0, y: 0, w: 2, h: 2 })];
    const pos = findFreePosition(existing, 2, 2, 12);
    expect(pos.x).toBe(2);
    expect(pos.y).toBe(0);
  });

  it("falls to the next row when row is full", () => {
    const existing: LayoutItem[] = [];
    for (let i = 0; i < 6; i++) {
      existing.push(mkItem({ id: `a${i}`, x: i * 2, y: 0, w: 2, h: 2 }));
    }
    const pos = findFreePosition(existing, 2, 2, 12);
    expect(pos.y).toBeGreaterThanOrEqual(2);
  });
});
