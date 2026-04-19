import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Container } from "../model/workspace.types";
import type { PixelRect } from "../lib/layout-utils";
import { stepSize } from "../lib/layout-utils";
import { useWorkspaceStore } from "../model/workspace.store";
import { ToolRenderer } from "./ToolRenderer";
import { PanelToolbar } from "./PanelToolbar";

interface Props {
  container: Container;
  rect: PixelRect;
  editMode: boolean;
  selected: boolean;
  onDragPointerDown: (e: ReactPointerEvent, id: string) => void;
  onResizePointerDown: (e: ReactPointerEvent, id: string) => void;
}

export function WorkspacePanel({
  container,
  rect,
  editMode,
  selected,
  onDragPointerDown,
  onResizePointerDown,
}: Props) {
  const aendereContainerGroesse = useWorkspaceStore((s) => s.aendereContainerGroesse);
  const tool = useWorkspaceStore((s) => s.findeTool(container.toolId));
  const resizable = editMode && (tool?.erlaubtResize ?? true);

  const onResizeKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, { dim: "breite" | "hoehe"; dir: 1 | -1 }> = {
      ArrowRight: { dim: "breite", dir: 1 },
      ArrowLeft: { dim: "breite", dir: -1 },
      ArrowDown: { dim: "hoehe", dir: 1 },
      ArrowUp: { dim: "hoehe", dir: -1 },
    };
    const action = map[e.key];
    if (!action) return;
    e.preventDefault();
    const next = stepSize(
      { breite: container.breite, hoehe: container.hoehe },
      action.dim,
      action.dir,
    );
    if (next.breite !== container.breite || next.hoehe !== container.hoehe) {
      aendereContainerGroesse(container.id, next.breite, next.hoehe);
    }
  };

  const titel = tool?.name ?? container.toolId;

  return (
    <div
      data-container-id={container.id}
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      className={[
        "flex flex-col overflow-hidden rounded-panel border bg-surface-muted transition-colors",
        editMode
          ? selected
            ? "border-accent shadow-lg shadow-accent/10"
            : "border-border-strong"
          : "border-border",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm font-medium",
          editMode ? "cursor-move select-none bg-surface-raised" : "",
        ].join(" ")}
        onPointerDown={editMode ? (e) => onDragPointerDown(e, container.id) : undefined}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 truncate" title={titel}>
            {titel}
          </span>
          {tool?.typ === "extern" && (
            <span className="rounded bg-surface px-1 text-[10px] uppercase tracking-wide text-text-muted">
              extern
            </span>
          )}
        </span>
        {editMode && <PanelToolbar containerId={container.id} />}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <ToolRenderer tool={tool} />
      </div>
      {resizable && (
        <div
          role="button"
          aria-label={`Größe ändern (${container.breite} mal ${container.hoehe})`}
          tabIndex={0}
          onPointerDown={(e) => onResizePointerDown(e, container.id)}
          onKeyDown={onResizeKeyDown}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-sm border border-border-strong bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      )}
    </div>
  );
}
