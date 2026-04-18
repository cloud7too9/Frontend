export interface ToolShortcut {
  id: string;
  label: string;
  url: string;
  icon: string;
}

export const TOOLS: ToolShortcut[] = [
  { id: "chat", label: "Chat", url: "https://claude.ai", icon: "💬" },
  { id: "editor", label: "Editor", url: "https://github.com", icon: "✏️" },
  { id: "suche", label: "Suche", url: "https://duckduckgo.com", icon: "🔍" },
  { id: "analyse", label: "Analyse", url: "https://observablehq.com", icon: "📊" },
];
