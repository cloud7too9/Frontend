import { Modal } from "../../../shared/ui/Modal";
import { useWorkspaceStore } from "../model/workspace.store";

export function AddPanelModal() {
  const open = useWorkspaceStore((s) => s.addPanelOpen);
  const closeAddPanel = useWorkspaceStore((s) => s.closeAddPanel);
  const fuegeContainerHinzu = useWorkspaceStore((s) => s.fuegeContainerHinzu);
  const tools = useWorkspaceStore((s) => s.tools);

  return (
    <Modal open={open} title="Container hinzufügen" onClose={closeAddPanel}>
      {tools.length === 0 ? (
        <div className="text-sm text-text-muted">Keine Tools verfügbar.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => fuegeContainerHinzu(tool.id)}
              className="flex flex-col gap-1 rounded-md border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-accent hover:bg-surface-raised"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {tool.name}
                <span className="rounded bg-surface-muted px-1 text-[10px] uppercase tracking-wide text-text-muted">
                  {tool.typ}
                </span>
              </span>
              <span className="text-xs text-text-muted">
                {(tool.standardBreite ?? 3)}×{(tool.standardHoehe ?? 2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
