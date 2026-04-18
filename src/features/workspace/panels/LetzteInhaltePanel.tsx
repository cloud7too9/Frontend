import { useEffect, useState } from "react";
import { useActivityStore, type ActivityType } from "../../content/activity.store";

const TYPE_LABEL: Record<ActivityType, string> = {
  note: "Notiz",
  task: "Aufgabe",
  file: "Datei",
  tool: "Tool",
};

function formatRelative(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
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
  const clear = useActivityStore((s) => s.clear);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-2 py-2 text-center text-xs text-text-muted">
        Noch keine Aktivität.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{entries.length} Einträge</span>
        <button
          type="button"
          onClick={clear}
          className="rounded px-1.5 py-0.5 text-text-muted hover:text-danger focus:outline focus:outline-2 focus:outline-accent"
        >
          Verlauf leeren
        </button>
      </div>
      <ul className="flex flex-col gap-1 overflow-auto">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                {TYPE_LABEL[e.type]}
              </span>
              <span className="truncate">{e.label}</span>
            </span>
            <span className="whitespace-nowrap text-xs text-text-muted">
              {formatRelative(e.timestamp, now)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
