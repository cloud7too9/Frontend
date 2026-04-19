import type { Tool } from "../model/workspace.types";
import { INTERN_REGISTRY } from "../model/tool-registry";

interface Props {
  tool: Tool | undefined;
}

export function ToolRenderer({ tool }: Props) {
  if (!tool) {
    return (
      <div className="text-sm text-text-muted">
        Unbekanntes Tool. Bitte Tool-Referenz prüfen.
      </div>
    );
  }
  if (tool.typ === "extern") {
    return (
      <iframe
        src={tool.quelle}
        title={tool.name}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    );
  }
  const Komponente = INTERN_REGISTRY[tool.quelle];
  if (!Komponente) {
    return (
      <div className="text-sm text-text-muted">
        Tool „{tool.name}" hat keine Komponente (quelle: {tool.quelle}).
      </div>
    );
  }
  return <Komponente />;
}
