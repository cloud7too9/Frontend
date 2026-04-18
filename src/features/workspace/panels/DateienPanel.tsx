import { useState } from "react";
import { useFilesStore } from "../../content/files.store";

export function DateienPanel() {
  const files = useFilesStore((s) => s.files);
  const addFile = useFilesStore((s) => s.addFile);
  const removeFile = useFilesStore((s) => s.removeFile);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addFile(name, url);
    setName("");
    setUrl("");
  };

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-1.5"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-surface hover:bg-accent-muted disabled:bg-border disabled:text-text-muted"
            disabled={!name.trim()}
          >
            Hinzu
          </button>
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (optional)"
          className="rounded-md border border-border bg-surface px-2 py-1 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </form>

      {files.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-2 py-2 text-center text-xs text-text-muted">
          Keine Einträge.
        </div>
      ) : (
        <ul className="flex flex-col gap-1 overflow-auto">
          {files.map((f) => (
            <li
              key={f.id}
              className="group flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
            >
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-accent hover:underline"
                >
                  {f.name}
                </a>
              ) : (
                <span className="flex-1 truncate">{f.name}</span>
              )}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label="Eintrag entfernen"
                className="rounded text-text-muted opacity-0 transition hover:text-danger group-hover:opacity-100 focus:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
