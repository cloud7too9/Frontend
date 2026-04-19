import type { ComponentType } from "react";
import { SchnellnotizPanel } from "../panels/SchnellnotizPanel";
import { AufgabenPanel } from "../panels/AufgabenPanel";
import { DateienPanel } from "../panels/DateienPanel";
import { ProjektstatusPanel } from "../panels/ProjektstatusPanel";
import { ToolStartPanel } from "../panels/ToolStartPanel";
import { LetzteInhaltePanel } from "../panels/LetzteInhaltePanel";

export const INTERN_REGISTRY: Record<string, ComponentType> = {
  schnellnotiz: SchnellnotizPanel,
  aufgaben: AufgabenPanel,
  dateien: DateienPanel,
  projektstatus: ProjektstatusPanel,
  toolstart: ToolStartPanel,
  letzteInhalte: LetzteInhaltePanel,
};
