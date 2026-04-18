import { useActivityStore, type ActivityType } from "../../content/activity.store";

const TYPE_LABEL: Record<ActivityType, string> = {
  note: "Notiz",
  task: "Aufgabe",
  file: "Datei",
  tool: "Tool",
};

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "gerade eben";
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} Min.`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tg.`;
}

export function LetzteInhaltePanel() {
  const entries = useActivityStore((s) => s.entries);

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-2 py-2 text-center text-xs text-text-muted">
        Noch keine Aktivität.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-xs uppercase tracking-wide text-text-muted">
              {TYPE_LABEL[e.type]}
            </span>
            <span className="truncate">{e.label}</span>
          </span>
          <span className="whitespace-nowrap text-xs text-text-muted">
            {formatRelative(e.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
