import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GRID_GAP, useWorkspaceStore } from "../model/workspace.store";
import {
  cellToPixel,
  columnWidth,
  clampContainerToGrid,
  gridRowCount,
  snapSize,
  type GridConfig,
  type PixelRect,
} from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import type { Id } from "../../../shared/types/common.types";
import type { Container } from "../model/workspace.types";
import { WorkspacePanel } from "./WorkspacePanel";
import { EmptyGridHint } from "./EmptyGridHint";

type DragState =
  | { kind: "idle" }
  | {
      kind: "move";
      id: Id;
      pointerId: number;
      startPointer: { x: number; y: number };
      startCell: { x: number; y: number };
      previewCell: { x: number; y: number };
      valid: boolean;
    }
  | {
      kind: "resize";
      id: Id;
      pointerId: number;
      startPointer: { x: number; y: number };
      startSize: { breite: number; hoehe: number };
      previewSize: { breite: number; hoehe: number };
      valid: boolean;
    };

export function WorkspaceGrid() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const tools = useWorkspaceStore((s) => s.tools);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const selectedContainerId = useWorkspaceStore((s) => s.selectedContainerId);
  const selectContainer = useWorkspaceStore((s) => s.selectContainer);
  const verschiebeContainer = useWorkspaceStore((s) => s.verschiebeContainer);
  const aendereContainerGroesse = useWorkspaceStore((s) => s.aendereContainerGroesse);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [drag, setDrag] = useState<DragState>({ kind: "idle" });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const config: GridConfig | null = useMemo(() => {
    if (!workspace) return null;
    return {
      cols: workspace.spalten,
      rowHeight: workspace.zeilenHoehe,
      gap: GRID_GAP,
      containerWidth,
    };
  }, [workspace, containerWidth]);

  const onDragPointerDown = (e: ReactPointerEvent, id: Id) => {
    if (!editMode || !workspace) return;
    e.preventDefault();
    const container = workspace.container.find((c) => c.id === id);
    if (!container) return;
    selectContainer(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      kind: "move",
      id,
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startCell: { x: container.x, y: container.y },
      previewCell: { x: container.x, y: container.y },
      valid: true,
    });
  };

  const onResizePointerDown = (e: ReactPointerEvent, id: Id) => {
    if (!editMode || !workspace) return;
    e.preventDefault();
    e.stopPropagation();
    const container = workspace.container.find((c) => c.id === id);
    if (!container) return;
    selectContainer(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      kind: "resize",
      id,
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startSize: { breite: container.breite, hoehe: container.hoehe },
      previewSize: { breite: container.breite, hoehe: container.hoehe },
      valid: true,
    });
  };

  useEffect(() => {
    if (drag.kind === "idle" || !workspace || !config) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startPointer.x;
      const dy = e.clientY - drag.startPointer.y;

      if (drag.kind === "move") {
        const c = workspace.container.find((it) => it.id === drag.id);
        if (!c) return;
        const colGap = columnWidth(config) + config.gap;
        const rowGap = config.rowHeight + config.gap;
        const dxCells = Math.round(dx / colGap);
        const dyCells = Math.round(dy / rowGap);
        const target = clampContainerToGrid(
          {
            ...c,
            x: drag.startCell.x + dxCells,
            y: Math.max(0, drag.startCell.y + dyCells),
          },
          workspace.spalten,
        );
        const valid = !hasCollision(target, workspace.container);
        setDrag({
          ...drag,
          previewCell: { x: target.x, y: target.y },
          valid,
        });
      } else if (drag.kind === "resize") {
        const c = workspace.container.find((it) => it.id === drag.id);
        if (!c) return;
        const tool = tools.find((t) => t.id === c.toolId);
        const colGap = columnWidth(config) + config.gap;
        const rowGap = config.rowHeight + config.gap;
        const rawBreite = drag.startSize.breite + dx / colGap;
        const rawHoehe = drag.startSize.hoehe + dy / rowGap;
        const minB = tool?.minBreite ?? 1;
        const minH = tool?.minHoehe ?? 1;
        const snapped = snapSize(Math.max(minB, rawBreite), Math.max(minH, rawHoehe));
        const candidate = clampContainerToGrid(
          { ...c, breite: snapped.breite, hoehe: snapped.hoehe },
          workspace.spalten,
        );
        const valid = !hasCollision(candidate, workspace.container);
        setDrag({
          ...drag,
          previewSize: { breite: candidate.breite, hoehe: candidate.hoehe },
          valid,
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      if (drag.kind === "move" && drag.valid) {
        verschiebeContainer(drag.id, drag.previewCell.x, drag.previewCell.y);
      }
      if (drag.kind === "resize" && drag.valid) {
        aendereContainerGroesse(drag.id, drag.previewSize.breite, drag.previewSize.hoehe);
      }
      setDrag({ kind: "idle" });
    };

    const onCancel = () => setDrag({ kind: "idle" });

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [drag, config, workspace, tools, verschiebeContainer, aendereContainerGroesse]);

  if (!workspace || !config) return null;
  if (workspace.container.length === 0) {
    return <EmptyGridHint />;
  }

  const totalRows = gridRowCount(workspace.container);
  const totalHeight = totalRows * workspace.zeilenHoehe + (totalRows - 1) * config.gap;

  const col = columnWidth(config);
  const gridBackground = editMode
    ? {
        backgroundImage: `repeating-linear-gradient(to right, rgb(var(--color-border) / 0.35) 0, rgb(var(--color-border) / 0.35) 1px, transparent 1px, transparent ${col + config.gap}px), repeating-linear-gradient(to bottom, rgb(var(--color-border) / 0.35) 0, rgb(var(--color-border) / 0.35) 1px, transparent 1px, transparent ${config.rowHeight + config.gap}px)`,
      }
    : {};

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: totalHeight, ...gridBackground }}
    >
      {workspace.container.map((c) => {
        const rect = cellToPixel(c.x, c.y, c.breite, c.hoehe, config);
        return (
          <WorkspacePanel
            key={c.id}
            container={c}
            rect={rect}
            editMode={editMode}
            selected={selectedContainerId === c.id}
            onDragPointerDown={onDragPointerDown}
            onResizePointerDown={onResizePointerDown}
          />
        );
      })}
      {drag.kind !== "idle" && (
        <DragPreview drag={drag} config={config} container={workspace.container} />
      )}
    </div>
  );
}

function DragPreview({
  drag,
  config,
  container,
}: {
  drag: Exclude<DragState, { kind: "idle" }>;
  config: GridConfig;
  container: Container[];
}) {
  const c = container.find((it) => it.id === drag.id);
  if (!c) return null;
  let rect: PixelRect;
  if (drag.kind === "move") {
    rect = cellToPixel(drag.previewCell.x, drag.previewCell.y, c.breite, c.hoehe, config);
  } else {
    rect = cellToPixel(c.x, c.y, drag.previewSize.breite, drag.previewSize.hoehe, config);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        pointerEvents: "none",
      }}
      className={[
        "rounded-panel border-2 border-dashed",
        drag.valid ? "border-accent bg-accent/10" : "border-danger bg-danger/10",
      ].join(" ")}
    />
  );
}
