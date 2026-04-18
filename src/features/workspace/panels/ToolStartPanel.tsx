import { TOOLS } from "../../content/tools.config";
import { useActivityStore } from "../../content/activity.store";

export function ToolStartPanel() {
  const log = useActivityStore((s) => s.log);

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {TOOLS.map((t) => (
        <a
          key={t.id}
          href={t.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => log({ type: "tool", label: `Tool: ${t.label}` })}
          className="rounded-md border border-border bg-surface px-2 py-2 text-left hover:border-border-strong hover:bg-surface-raised"
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
