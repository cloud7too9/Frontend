import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { useWorkspaceStore } from "../model/workspace.store";

export function WorkspaceHeader() {
  const editMode = useWorkspaceStore((s) => s.editMode);
  const toggleEditMode = useWorkspaceStore((s) => s.toggleEditMode);
  const openAddPanel = useWorkspaceStore((s) => s.openAddPanel);
  const resetLayout = useWorkspaceStore((s) => s.resetLayout);
  const saveLayoutNow = useWorkspaceStore((s) => s.saveLayoutNow);
  const layoutName = useWorkspaceStore((s) => s.layout.name);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">MainHub</h1>
        <span className="text-sm text-text-muted">Workspace · {layoutName}</span>
      </div>
      <div className="flex items-center gap-2">
        {editMode && (
          <>
            <Button variant="ghost" onClick={openAddPanel}>
              + Panel hinzufügen
            </Button>
            <Button variant="ghost" onClick={() => setResetOpen(true)}>
              Zurücksetzen
            </Button>
            <Button variant="ghost" onClick={saveLayoutNow}>
              Speichern
            </Button>
          </>
        )}
        <Button
          variant={editMode ? "primary" : "ghost"}
          onClick={toggleEditMode}
          aria-pressed={editMode}
        >
          {editMode ? "Fertig" : "Bearbeiten"}
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Layout zurücksetzen?"
        description="Dein aktueller Workspace wird durch das Standardlayout ersetzt. Diese Aktion lässt sich nicht rückgängig machen."
        confirmLabel="Zurücksetzen"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetLayout();
          setResetOpen(false);
        }}
      />
    </header>
  );
}
