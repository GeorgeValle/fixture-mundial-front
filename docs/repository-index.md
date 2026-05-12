# Repository Index for ChatGPT Analysis

This document provides a compact, analysis-oriented map of the `fixture-mundial-front` repository so a ChatGPT session can quickly understand project scope, architecture, and where to inspect code.

## 1) Project Snapshot

- **Name:** `fixture-mundial-front`
- **Type:** React + Vite frontend
- **Domain:** FIFA World Cup 2026 fixture, standings, knockout bracket, predictions, and admin tools.
- **Primary stack:** React, React Router DOM, Redux Toolkit, Axios, Zod, Vitest, React Testing Library, CSS Modules.

## 2) Root-Level File Guide

- `README.md` → setup and developer-facing overview.
- `AGENTS.md` → repository operating constraints and workflow rules for coding agents.
- `DESIGN.md` → design system and UI/UX alignment guidance.
- `package.json` → scripts and dependency definitions.
- `vite.config.js` / `vitest.config.js` → build and test configuration.
- `eslint.config.js` → lint rules.
- `pnpm-lock.yaml` / `pnpm-workspace.yaml` → dependency lock/workspace metadata.
- `vercel.json` → deployment/runtime behavior for Vercel.

## 3) Documentation Map (`docs/`)

- Product and planning:
  - `docs/project-requirements.md`
  - `docs/task.md`
- Feature specifications:
  - `docs/home.md`
  - `docs/group-fixtures.md`
  - `docs/group-standings.md`
  - `docs/knockout-stage.md`
  - `docs/prediction-fixture.md`
- Backend/API contracts and engines:
  - `docs/api-back.md`
  - `docs/api-contract.md`
  - `docs/API-Backend-Mundial-2026.md`
  - `docs/Backed_Standings_Engine.md`
  - `docs/Backend_Bracket_Engine.md`
  - `docs/Backend_Transition_Engine.md`

## 4) Source Tree Overview (`src/`)

- App bootstrap:
  - `src/main.jsx`
  - `src/App.jsx`
- Routing:
  - `src/routes/AppRoutes.jsx`
  - `src/routes/AdminRoutes.test.jsx`, `src/routes/AppRoutes.test.jsx`
- State management:
  - `src/app/store.js`
  - `src/features/ui/uiSlice.js`
  - `src/features/adminAuth/adminAuthSlice.js`
- Constants:
  - `src/constants/` (routes, groups, stages, storage keys, statuses)
- Services:
  - `src/services/api/axiosClient.js`
  - `src/services/matches/matchesService.js`
  - `src/services/standings/standingsService.js`
  - `src/services/predictions/predictionStorageService.js`
  - `src/services/errors/*`
  - `src/services/admin/*`
- Schemas and validation:
  - `src/schemas/*` (match, standings, prediction, admin result)
- Utilities:
  - `src/utils/*` (date adapter, delayed loading, knockout adapter, prediction logic)
- UI composition:
  - `src/layouts/*`
  - `src/pages/*`
  - `src/components/*`
- Tests and test infra:
  - `src/test/setupTests.js`
  - `src/test/msw/*`

## 5) Feature-to-Code Index

- **Home experience**
  - `src/pages/Home/Home.jsx`
  - Supporting UI: `src/components/DailyScheduleCard/*`, `src/components/HomeOnboardingTour/*`
- **Group fixtures (`/grupos`)**
  - `src/pages/GroupFixtures/GroupFixtures.jsx`
  - Supporting UI: `src/components/GroupSelector/*`, `src/components/FixtureMatchCard/*`
  - Data service: `src/services/matches/matchesService.js`
- **Group standings (`/posiciones`)**
  - `src/pages/GroupStandings/GroupStandings.jsx`
  - UI: `src/components/StandingsGroupCard/*`, `src/components/StandingsTable/*`
  - Data service/schema: `src/services/standings/standingsService.js`, `src/schemas/standingsSchema.js`
- **Knockout stage (`/eliminatorias`)**
  - `src/pages/KnockoutStage/KnockoutStage.jsx`
  - UI: `src/components/KnockoutBracket/*`, `src/components/KnockoutRound/*`, `src/components/KnockoutMatchCard/*`
  - Adapter/data: `src/utils/knockoutStageAdapter.js`, `src/data/knockoutStageSkeleton.js`
- **Predictions (`/predicciones`)**
  - `src/pages/PredictionFixture/PredictionFixture.jsx`
  - UI: `src/components/Prediction*/*`, `src/components/KnockoutPredictionsClosedPanel/*`
  - Logic/storage: `src/utils/predictionScoring.js`, `src/utils/predictionLocking.js`, `src/services/predictions/predictionStorageService.js`
- **Admin area**
  - Layout: `src/layouts/AdminLayout/*`
  - Pages: `src/pages/Admin*`
  - Services: `src/services/admin/*`
  - Guarding: `src/components/AdminProtectedRoute/*`

## 6) Styling and Asset Conventions

- Component and page styles use **CSS Modules** (`*.module.css`).
- Global style baseline is in `src/index.css`.
- Images/icons live under `src/assets/` and `public/`.

## 7) Testing Index

- Unit tests next to related modules (`*.test.js` / `*.test.jsx`).
- API mocking with MSW handlers in `src/test/msw/`.
- Test setup bootstrapped by `src/test/setupTests.js`.

## 8) Suggested Analysis Reading Order for ChatGPT

1. `README.md`
2. `docs/project-requirements.md`
3. `docs/task.md`
4. `docs/api-contract.md` and `docs/api-back.md`
5. `src/routes/AppRoutes.jsx`
6. `src/app/store.js` + `src/features/*`
7. `src/services/api/axiosClient.js` and domain services
8. Target page folder and its dependent components/utilities

## 9) Notes for Prompting ChatGPT Against This Repo

When asking ChatGPT to analyze or modify this codebase, include:

- The target feature/page/path.
- Whether scope is planning, implementation, or QA.
- Any relevant backend contract file(s) from `docs/`.
- Constraints: JavaScript only, CSS Modules, PNPM workflows.
