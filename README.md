# MainHub Frontend

Modulares Workspace-Layout-System für MainHub. Grid-basierte Panels, verschiebbar, skalierbar, lokal persistiert.

## Getting Started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Produktions-Build
npm run test         # Unit-Tests
npm run typecheck    # TS-Check
```

## Architektur

- `src/app/` – App-Einstieg und Routing
- `src/pages/WorkspacePage.tsx` – Haupt-Workspace
- `src/features/workspace/` – Grid, Panels, Layout-Logik, Store
- `src/shared/` – Wiederverwendbare UI und Tokens
- `src/tests/` – Unit-Tests

Siehe Plan-Datei für Designregeln (12-Spalten-Grid, feste Größenstufen, getrennter Bearbeitungsmodus).
