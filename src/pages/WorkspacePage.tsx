import { useEffect } from "react";
import { WorkspaceHeader } from "../features/workspace/components/WorkspaceHeader";
import { WorkspaceGrid } from "../features/workspace/components/WorkspaceGrid";
import { AddPanelModal } from "../features/workspace/components/AddPanelModal";
import { useWorkspaceStore } from "../features/workspace/model/workspace.store";

export function WorkspacePage() {
  const ladeWorkspace = useWorkspaceStore((s) => s.ladeWorkspace);
  const ladeStatus = useWorkspaceStore((s) => s.ladeStatus);
  const ladeFehler = useWorkspaceStore((s) => s.ladeFehler);

  useEffect(() => {
    void ladeWorkspace();
  }, [ladeWorkspace]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-text">
      <WorkspaceHeader />
      <main className="flex-1 px-4 py-4">
        {ladeStatus === "laedt" || ladeStatus === "idle" ? (
          <div className="py-16 text-center text-sm text-text-muted">Lädt …</div>
        ) : ladeStatus === "fehler" ? (
          <div className="rounded-panel border border-danger bg-danger/10 p-4 text-sm text-danger">
            Workspace konnte nicht geladen werden: {ladeFehler}
          </div>
        ) : (
          <WorkspaceGrid />
        )}
      </main>
      <AddPanelModal />
    </div>
  );
}
