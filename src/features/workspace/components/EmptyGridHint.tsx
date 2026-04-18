import { Button } from "../../../shared/ui/Button";
import { useWorkspaceStore } from "../model/workspace.store";

export function EmptyGridHint() {
  const openAddPanel = useWorkspaceStore((s) => s.openAddPanel);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const setEditMode = useWorkspaceStore((s) => s.setEditMode);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-panel border border-dashed border-border py-16 text-center">
      <div className="text-lg font-medium">Dein Workspace ist leer</div>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Füge Panels hinzu, um deinen Arbeitsbereich zu gestalten.
      </p>
      <div className="mt-4 flex gap-2">
        {!editMode && (
          <Button variant="ghost" onClick={() => setEditMode(true)}>
            Bearbeiten
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            if (!editMode) setEditMode(true);
            openAddPanel();
          }}
        >
          Panel hinzufügen
        </Button>
      </div>
    </div>
  );
}
