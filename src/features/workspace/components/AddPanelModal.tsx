import { Modal } from "../../../shared/ui/Modal";
import { PANEL_REGISTRY, PANEL_TYPEN } from "../model/panel-registry";
import { useWorkspaceStore } from "../model/workspace.store";

export function AddPanelModal() {
  const open = useWorkspaceStore((s) => s.addPanelOpen);
  const closeAddPanel = useWorkspaceStore((s) => s.closeAddPanel);
  const addItem = useWorkspaceStore((s) => s.addItem);

  return (
    <Modal open={open} title="Panel hinzufügen" onClose={closeAddPanel}>
      <div className="grid grid-cols-2 gap-3">
        {PANEL_TYPEN.map((typ) => {
          const def = PANEL_REGISTRY[typ];
          return (
            <button
              key={typ}
              type="button"
              onClick={() => addItem(typ)}
              className="flex flex-col gap-1 rounded-md border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-accent hover:bg-surface-raised"
            >
              <span className="text-sm font-medium">{def.standardTitel}</span>
              <span className="text-xs text-text-muted">
                {def.standardBreite}×{def.standardHoehe} · min {def.minBreite}×{def.minHoehe}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
