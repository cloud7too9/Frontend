import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { useWorkspaceStore } from "../model/workspace.store";
import { NewWorkspaceModal } from "./NewWorkspaceModal";
import { RenameWorkspaceModal } from "./RenameWorkspaceModal";

interface Props {
  activeName: string;
}

export function WorkspaceSwitcher({ activeName }: Props) {
  const order = useWorkspaceStore((s) => s.order);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const duplicateWorkspace = useWorkspaceStore((s) => s.duplicateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onlyOne = order.length <= 1;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-text-muted hover:border-border-strong hover:bg-surface-raised"
      >
        <span>Workspace · {activeName}</span>
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1 w-64 rounded-md border border-border bg-surface-raised p-1 shadow-lg"
        >
          <ul className="flex flex-col">
            {order.map((id) => {
              const ws = workspaces[id];
              const active = id === activeId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      switchWorkspace(id);
                      setOpen(false);
                    }}
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm",
                      active ? "bg-surface text-text" : "text-text hover:bg-surface",
                    ].join(" ")}
                  >
                    <span className="truncate">{ws.name}</span>
                    {active && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1 h-px bg-border" />
          <ul className="flex flex-col">
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setNewOpen(true);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text hover:bg-surface"
              >
                + Neu aus Vorlage
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setRenameOpen(true);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text hover:bg-surface"
              >
                Umbenennen
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  duplicateWorkspace(activeId);
                  setOpen(false);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text hover:bg-surface"
              >
                Duplizieren
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                disabled={onlyOne}
                onClick={() => {
                  setOpen(false);
                  setDeleteOpen(true);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-danger hover:bg-surface disabled:cursor-not-allowed disabled:text-text-muted"
              >
                Löschen
              </button>
            </li>
          </ul>
        </div>
      )}

      <NewWorkspaceModal open={newOpen} onClose={() => setNewOpen(false)} />
      <RenameWorkspaceModal open={renameOpen} onClose={() => setRenameOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        title="Workspace löschen?"
        description={`„${activeName}" wird dauerhaft entfernt. Inhalte der anderen Workspaces bleiben erhalten.`}
        confirmLabel="Löschen"
        danger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteWorkspace(activeId);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
