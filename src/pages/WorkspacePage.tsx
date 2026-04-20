import { useEffect } from "react";
import { WorkspaceHeader } from "../features/workspace/components/WorkspaceHeader";
import { WorkspaceGrid } from "../features/workspace/components/WorkspaceGrid";
import { AddPanelModal } from "../features/workspace/components/AddPanelModal";
import { useWorkspaceStore } from "../features/workspace/model/workspace.store";

export function WorkspacePage() {
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-text">
      <WorkspaceHeader />
      <main className="flex-1 px-4 py-4">
        <WorkspaceGrid />
      </main>
      <AddPanelModal />
    </div>
  );
}
