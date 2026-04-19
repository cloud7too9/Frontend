import type { Container } from "../model/workspace.types";
import { rectsOverlap } from "./layout-utils";

export function hasCollision(candidate: Container, others: Container[]): boolean {
  return others.some((o) => o.id !== candidate.id && rectsOverlap(candidate, o));
}
