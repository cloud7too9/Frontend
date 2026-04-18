import { useNotesStore } from "../../content/notes.store";

export function SchnellnotizPanel() {
  const text = useNotesStore((s) => s.text);
  const setText = useNotesStore((s) => s.setText);

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Kurze Gedanken, sofort festhalten…"
        className="h-full w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}
