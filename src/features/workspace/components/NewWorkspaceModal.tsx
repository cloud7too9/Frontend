import { useEffect, useState } from "react";
import { Modal } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { DEFAULT_TEMPLATES, START_TEMPLATE_ID } from "../model/default-templates";
import { useWorkspaceStore } from "../model/workspace.store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewWorkspaceModal({ open, onClose }: Props) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const [templateId, setTemplateId] = useState(START_TEMPLATE_ID);
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setTemplateId(START_TEMPLATE_ID);
      setName("");
    }
  }, [open]);

  const submit = () => {
    createWorkspace(templateId, name);
    onClose();
  };

  return (
    <Modal open={open} title="Workspace aus Vorlage" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_TEMPLATES.map((tpl) => {
          const selected = tpl.id === templateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplateId(tpl.id)}
              aria-pressed={selected}
              className={[
                "flex flex-col gap-1 rounded-md border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-accent bg-surface-raised"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised",
              ].join(" ")}
            >
              <span className="text-sm font-medium">{tpl.name}</span>
              <span className="text-xs text-text-muted">{tpl.beschreibung}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-xs text-text-muted" htmlFor="new-ws-name">
          Name (optional)
        </label>
        <input
          id="new-ws-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={DEFAULT_TEMPLATES.find((t) => t.id === templateId)?.name ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={submit}>
          Anlegen
        </Button>
      </div>
    </Modal>
  );
}
