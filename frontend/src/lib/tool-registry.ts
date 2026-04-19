import type { Tool } from "@mainhub/shared";

export function resolveTool(tools: Tool[], toolId: string): Tool | undefined {
  return tools.find((t) => t.id === toolId);
}
