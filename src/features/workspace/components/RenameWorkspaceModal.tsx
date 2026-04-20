import { useEffect, useRef, useState } from "react";
import { Modal } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { selectActiveLayout, useWorkspaceStore } from "../model/workspace.store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RenameWorkspaceModal({ open, onClose }: Props) {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const currentName = useWorkspaceStore((s) => selectActiveLayout(s).name);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, currentName]);

  const submit = () => {
    renameWorkspace(activeId, name);
    onClose();
  };

  return (
    <Modal open={open} title="Workspace umbenennen" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted" htmlFor="rename-ws-name">
          Name
        </label>
        <input
          id="rename-ws-name"
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={submit} disabled={!name.trim()}>
          Speichern
        </Button>
      </div>
    </Modal>
  );
}
