export interface ToolShortcut {
  id: string;
  label: string;
  url: string;
}

export const TOOLS: ToolShortcut[] = [
  { id: "chat", label: "Chat", url: "https://claude.ai" },
  { id: "editor", label: "Editor", url: "https://github.com" },
  { id: "suche", label: "Suche", url: "https://duckduckgo.com" },
  { id: "analyse", label: "Analyse", url: "https://observablehq.com" },
];
