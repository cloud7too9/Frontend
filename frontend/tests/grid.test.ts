import { describe, expect, it } from "vitest";
import type { Container, Workspace } from "@mainhub/shared";
import {
  cellToPixel,
  clampPosition,
  clampSize,
  findFreeSpot,
  gridHeightRows,
  metricsFor,
  overlaps,
  pixelDeltaToCells,
} from "../src/lib/grid.js";

const ws: Workspace = {
  id: "ws-1",
  name: "t",
  spalten: 12,
  zeilenHoehe: 80,
  container: [],
};

describe("grid math", () => {
  it("cellToPixel platziert Container korrekt am Ursprung", () => {
    const m = metricsFor(ws, 1000);
    const box = cellToPixel(0, 0, 1, 1, m);
    expect(box.left).toBe(m.gap);
    expect(box.top).toBe(m.gap);
    expect(box.width).toBe(m.spaltenBreite);
    expect(box.height).toBe(m.zeilenHoehe);
  });

  it("cellToPixel addiert Gap zwischen Zellen", () => {
    const m = metricsFor(ws, 1000);
    const box = cellToPixel(2, 1, 2, 2, m);
    expect(box.left).toBe(m.gap + 2 * (m.spaltenBreite + m.gap));
    expect(box.top).toBe(m.gap + 1 * (m.zeilenHoehe + m.gap));
    expect(box.width).toBe(2 * m.spaltenBreite + m.gap);
    expect(box.height).toBe(2 * m.zeilenHoehe + m.gap);
  });

  it("pixelDeltaToCells snap auf Zellschritte", () => {
    const m = metricsFor(ws, 1000);
    const step = m.spaltenBreite + m.gap;
    expect(pixelDeltaToCells(step * 2, 0, m).dxCells).toBe(2);
    expect(pixelDeltaToCells(step * 0.4, 0, m).dxCells).toBe(0);
    expect(pixelDeltaToCells(-step * 1.6, 0, m).dxCells).toBe(-2);
  });

  it("clampPosition erzwingt Grenzen", () => {
    const c: Container = { id: "c", toolId: "t", x: -3, y: -1, breite: 4, hoehe: 2 };
    const clamped = clampPosition(c, 12);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
    const c2: Container = { id: "c", toolId: "t", x: 15, y: 5, breite: 4, hoehe: 2 };
    expect(clampPosition(c2, 12).x).toBe(8);
  });

  it("clampSize haelt min 1 und passt an Spalten an", () => {
    const c: Container = { id: "c", toolId: "t", x: 10, y: 0, breite: 5, hoehe: 0 };
    const clamped = clampSize(c, 12);
    expect(clamped.breite).toBe(2);
    expect(clamped.hoehe).toBe(1);
  });

  it("overlaps erkennt Ueberlappung und Trennung", () => {
    const a: Container = { id: "a", toolId: "t", x: 0, y: 0, breite: 2, hoehe: 2 };
    const b: Container = { id: "b", toolId: "t", x: 1, y: 1, breite: 2, hoehe: 2 };
    const c: Container = { id: "c", toolId: "t", x: 3, y: 0, breite: 2, hoehe: 2 };
    expect(overlaps(a, b)).toBe(true);
    expect(overlaps(a, c)).toBe(false);
  });

  it("findFreeSpot umgeht Ueberlappung", () => {
    const taken: Container[] = [
      { id: "a", toolId: "t", x: 0, y: 0, breite: 2, hoehe: 2 },
    ];
    const spot = findFreeSpot(taken, 12, 2, 2);
    expect(spot).toEqual({ x: 2, y: 0 });
  });

  it("gridHeightRows reflektiert tiefsten Container", () => {
    expect(gridHeightRows([])).toBe(6);
    expect(
      gridHeightRows([{ id: "a", toolId: "t", x: 0, y: 5, breite: 2, hoehe: 3 }])
    ).toBe(9);
  });
});
