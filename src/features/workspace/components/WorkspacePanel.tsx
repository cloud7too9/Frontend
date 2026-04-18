import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { LayoutItem } from "../model/workspace.types";
import type { PixelRect } from "../lib/layout-utils";
import { stepSize } from "../lib/layout-utils";
import { PANEL_REGISTRY } from "../model/panel-registry";
import { useWorkspaceStore } from "../model/workspace.store";
import { PanelContentRenderer } from "./PanelContentRenderer";
import { PanelToolbar } from "./PanelToolbar";

interface Props {
  item: LayoutItem;
  rect: PixelRect;
  editMode: boolean;
  selected: boolean;
  onDragPointerDown: (e: ReactPointerEvent, id: string) => void;
  onResizePointerDown: (e: ReactPointerEvent, id: string) => void;
}

export function WorkspacePanel({
  item,
  rect,
  editMode,
  selected,
  onDragPointerDown,
  onResizePointerDown,
}: Props) {
  const resizeItem = useWorkspaceStore((s) => s.resizeItem);
  const renameItem = useWorkspaceStore((s) => s.renameItem);
  const def = PANEL_REGISTRY[item.panelTyp];
  const resizable = editMode && def.erlaubtResize;

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(item.titel);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editMode) setRenaming(false);
  }, [editMode]);

  useEffect(() => {
    if (renaming) {
      setDraft(item.titel);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [renaming, item.titel]);

  const commitRename = () => {
    renameItem(item.id, draft);
    setRenaming(false);
  };

  const cancelRename = () => {
    setDraft(item.titel);
    setRenaming(false);
  };

  const onResizeKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, { dim: "w" | "h"; dir: 1 | -1 }> = {
      ArrowRight: { dim: "w", dir: 1 },
      ArrowLeft: { dim: "w", dir: -1 },
      ArrowDown: { dim: "h", dir: 1 },
      ArrowUp: { dim: "h", dir: -1 },
    };
    const action = map[e.key];
    if (!action) return;
    e.preventDefault();
    const next = stepSize({ w: item.w, h: item.h }, action.dim, action.dir);
    if (next.w !== item.w || next.h !== item.h) {
      resizeItem(item.id, next.w, next.h);
    }
  };

  return (
    <div
      data-panel-id={item.id}
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
          editMode && !renaming ? "cursor-move select-none bg-surface-raised" : "",
          editMode && renaming ? "bg-surface-raised" : "",
        ].join(" ")}
        onPointerDown={
          editMode && !renaming ? (e) => onDragPointerDown(e, item.id) : undefined
        }
      >
        {renaming ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelRename();
              }
            }}
            onBlur={commitRename}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Paneltitel bearbeiten"
            className="flex-1 rounded border border-border bg-surface px-1.5 py-0.5 text-sm focus:border-accent focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 truncate"
            onDoubleClick={() => {
              if (editMode) setRenaming(true);
            }}
            title={editMode ? "Doppelklick zum Umbenennen" : undefined}
          >
            {item.titel}
          </span>
        )}
        {editMode && !renaming && <PanelToolbar panelId={item.id} />}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <PanelContentRenderer typ={item.panelTyp} />
      </div>
      {resizable && (
        <div
          role="button"
          aria-label={`Größe ändern (${item.w} mal ${item.h})`}
          tabIndex={0}
          onPointerDown={(e) => onResizePointerDown(e, item.id)}
          onKeyDown={onResizeKeyDown}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-sm border border-border-strong bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      )}
    </div>
  );
}
