import { describe, expect, it } from "vitest";
import {
  cellToPixel,
  clampContainerToGrid,
  columnWidth,
  findFreePosition,
  pixelToCell,
  rectsOverlap,
  snapSize,
  stepSize,
} from "../features/workspace/lib/layout-utils";
import { hasCollision } from "../features/workspace/lib/collision-utils";
import type { Container } from "../features/workspace/model/workspace.types";

const baseConfig = { cols: 12, rowHeight: 80, gap: 12, containerWidth: 1200 };

const mkContainer = (overrides: Partial<Container>): Container => ({
  id: "x",
  toolId: "tool-schnellnotiz",
  x: 0,
  y: 0,
  breite: 2,
  hoehe: 2,
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

describe("clampContainerToGrid", () => {
  it("prevents overflow on the right", () => {
    const clamped = clampContainerToGrid(mkContainer({ x: 11, breite: 4 }), 12);
    expect(clamped.x + clamped.breite).toBeLessThanOrEqual(12);
  });

  it("truncates width larger than grid", () => {
    const clamped = clampContainerToGrid(mkContainer({ x: 0, breite: 20 }), 12);
    expect(clamped.breite).toBe(12);
  });
});

describe("snapSize", () => {
  it("snaps arbitrary size to nearest allowed", () => {
    const snapped = snapSize(3.4, 1.9);
    expect(snapped).toEqual({ breite: 3, hoehe: 2 });
  });

  it("returns a size from the allowed list", () => {
    const snapped = snapSize(5, 3);
    expect([
      { breite: 4, hoehe: 3 },
      { breite: 6, hoehe: 3 },
      { breite: 4, hoehe: 2 },
    ]).toContainEqual(snapped);
  });
});

describe("rectsOverlap / hasCollision", () => {
  it("detects overlap", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, breite: 2, hoehe: 2 },
        { x: 1, y: 1, breite: 2, hoehe: 2 },
      ),
    ).toBe(true);
  });

  it("ignores adjacent rects", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, breite: 2, hoehe: 2 },
        { x: 2, y: 0, breite: 2, hoehe: 2 },
      ),
    ).toBe(false);
  });

  it("ignores the same item (by id) when checking collisions", () => {
    const a = mkContainer({ id: "a", x: 0, y: 0, breite: 2, hoehe: 2 });
    const b = mkContainer({ id: "b", x: 5, y: 0, breite: 2, hoehe: 2 });
    expect(hasCollision(a, [a, b])).toBe(false);
  });
});

describe("stepSize", () => {
  it("returns the current size when no bigger candidate exists (breite)", () => {
    const r = stepSize({ breite: 6, hoehe: 3 }, "breite", 1);
    expect(r).toEqual({ breite: 6, hoehe: 3 });
  });

  it("returns the current size when no smaller candidate exists (hoehe)", () => {
    const r = stepSize({ breite: 1, hoehe: 1 }, "hoehe", -1);
    expect(r).toEqual({ breite: 1, hoehe: 1 });
  });

  it("grows breite to the nearest allowed bigger breite", () => {
    const r = stepSize({ breite: 2, hoehe: 1 }, "breite", 1);
    expect(r.breite).toBeGreaterThan(2);
  });

  it("shrinks hoehe to the nearest allowed smaller hoehe", () => {
    const r = stepSize({ breite: 4, hoehe: 3 }, "hoehe", -1);
    expect(r.hoehe).toBeLessThan(3);
  });
});

describe("findFreePosition", () => {
  it("places the first container at origin", () => {
    expect(findFreePosition([], 2, 2, 12)).toEqual({ x: 0, y: 0 });
  });

  it("finds a spot next to an existing container", () => {
    const existing = [mkContainer({ id: "a", x: 0, y: 0, breite: 2, hoehe: 2 })];
    const pos = findFreePosition(existing, 2, 2, 12);
    expect(pos.x).toBe(2);
    expect(pos.y).toBe(0);
  });

  it("falls to the next row when row is full", () => {
    const existing: Container[] = [];
    for (let i = 0; i < 6; i++) {
      existing.push(mkContainer({ id: `a${i}`, x: i * 2, y: 0, breite: 2, hoehe: 2 }));
    }
    const pos = findFreePosition(existing, 2, 2, 12);
    expect(pos.y).toBeGreaterThanOrEqual(2);
  });
});
