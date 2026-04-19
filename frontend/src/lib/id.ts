export function createId(prefix: string = "c"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}-${Date.now().toString(36)}`;
}
