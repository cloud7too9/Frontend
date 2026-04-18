# MainHub Frontend

Modulares Workspace-Layout-System für MainHub. Grid-basierte Panels, verschiebbar, skalierbar, lokal persistiert.

## Getting Started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Produktions-Build
npm run test         # Unit-Tests
npm run typecheck    # TypeScript-Check
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run check        # typecheck + lint + test
```

## Architektur

- `src/app/` – App-Einstieg und Routing
- `src/pages/WorkspacePage.tsx` – Haupt-Workspace
- `src/features/workspace/` – Grid, Panels, Layout-Logik, Store
- `src/shared/` – Wiederverwendbare UI und Tokens
- `src/tests/` – Unit-Tests

## Design-Regeln

1. **12-Spalten-Grid** mit fester Zeilenhöhe (80 px) und definiertem Gap (12 px).
2. **Feste Größenstufen** (1×1, 2×1, 2×2, 3×2, 4×2, 4×3, 6×3) – keine beliebige Freiform.
3. **Getrennte Modi**: Normal (stabil, nur Inhalt) und Edit (Drag, Resize, Toolbar).

Neue Paneltypen müssen in `src/features/workspace/model/panel-registry.ts` registriert werden.
