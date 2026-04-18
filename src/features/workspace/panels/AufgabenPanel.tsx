import { useState } from "react";
import { useTasksStore } from "../../content/tasks.store";

export function AufgabenPanel() {
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const [draft, setDraft] = useState("");

  const submit = () => {
    if (!draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Neue Aufgabe…"
          className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-surface hover:bg-accent-muted disabled:bg-border disabled:text-text-muted"
          disabled={!draft.trim()}
        >
          Hinzu
        </button>
      </form>

      {tasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-2 py-2 text-center text-xs text-text-muted">
          Keine Aufgaben.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5 overflow-auto">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                aria-label={t.done ? "Auf offen setzen" : "Als erledigt markieren"}
                className="accent-accent"
              />
              <span className={`flex-1 ${t.done ? "text-text-muted line-through" : "text-text"}`}>
                {t.text}
              </span>
              <button
                type="button"
                onClick={() => removeTask(t.id)}
                aria-label="Aufgabe entfernen"
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
