# Task Plan

## Current Mode

Build Mode in Codex without runtime commands. The user validated WSL manually in their own terminal, but the internal Codex shell still must not run `node`, `pnpm`, install, build, lint, test, or dev commands for this task.

## Execution Rule

All tasks must be executed through the Orchestrator Agent defined in `AGENTS.md`.

Before starting any task:

- Read `project-requirements.md`.
- Read this `task.md`.
- Read the relevant page-specific MD.
- Search Engram MCP for related project memory.
- Delegate to the correct subagent.
- Add or update tests when behavior changes.
- Request QA review before marking the task complete.

A task is not complete until implementation, documentation, tests and QA review are aligned.

## Runtime Status

### User-validated external WSL runtime

The user reported these values from their own WSL terminal:

- `which node` → `/home/yorch/.nvm/versions/node/v24.14.0/bin/node`
- `which pnpm` → `/home/yorch/.nvm/versions/node/v24.14.0/bin/pnpm`
- `node -v` → `v24.14.0`
- `pnpm -v` → `10.33.0`

### Codex execution constraint

- Codex internal shell may still resolve Windows paths incorrectly.
- For this task, do not run package-manager commands, project scripts, build, lint, test, or dev commands from Codex.
- The user will run dependency installation and validation commands manually in their own WSL terminal and share results back.

## Current Repository Status

### Existing root files and folders

- Existing Vite app files:
  - `package.json`
  - `pnpm-lock.yaml`
  - `vite.config.js`
  - `vitest.config.js`
  - `index.html`
  - `eslint.config.js`
  - `.gitignore`
  - `README.md`
- Existing project instructions:
  - `AGENTS.md`
  - `docs/task.md`
  - `docs/project-requirements.md`
  - `docs/API-Backend-Mundial-2026.md`
- Existing documentation files:
  - `docs/home.md`
  - `docs/group-fixtures.md`
  - `docs/group-standings.md`
  - `docs/knockout-stage.md`
  - `docs/prediction-fixture.md`
- Existing folders now used by the base architecture:
  - `.codex/`
  - `docs/`
  - `public/`
  - `src/`
  - `src/app/`
  - `src/components/`
  - `src/constants/`
  - `src/features/`
  - `src/layouts/`
  - `src/pages/`
  - `src/routes/`
  - `src/services/`
  - `src/test/`

### Scripts available in `package.json`

- `dev`: `vite`
- `build`: `vite build`
- `lint`: `eslint .`
- `preview`: `vite preview`
- `test`: `vitest run`
- `test:watch`: `vitest`

### Declared installed dependencies

Runtime dependencies declared in `package.json`:

- `react` `^19.2.5`
- `react-dom` `^19.2.5`
- `react-router-dom` `^7.14.2`
- `@reduxjs/toolkit` `^2.11.2`
- `react-redux` `^9.2.0`
- `axios` `^1.15.2`
- `zod` `^4.3.6`

Development dependencies declared in `package.json`:

- `@eslint/js` `^10.0.1`
- `@testing-library/jest-dom` `^6.9.1`
- `@testing-library/react` `^16.3.2`
- `@testing-library/user-event` `^14.6.1`
- `@types/react` `^19.2.14`
- `@types/react-dom` `^19.2.3`
- `@vitejs/plugin-react` `^6.0.1`
- `eslint` `^10.2.1`
- `eslint-plugin-react-hooks` `^7.1.1`
- `eslint-plugin-react-refresh` `^0.5.2`
- `globals` `^17.5.0`
- `jsdom` `^29.1.0`
- `msw` `^2.13.6`
- `vite` `^8.0.10`
- `vitest` `^4.1.5`

### Missing approved dependencies

Core app dependencies still missing from `package.json`:

- None for Bloque 1 base architecture.

Testing dependencies still missing from `package.json`:

- None for Bloque 1 base testing setup.

Optional future form dependencies not yet needed:

- `react-hook-form`
- `@hookform/resolvers`

## Manual Validation Results

The user ran the following commands manually from their WSL terminal and all passed:

- `pnpm run build` ✅
- `pnpm run lint` ✅
- `pnpm run test` ✅

Observed successful results:

- Production build completed successfully with Vite.
- ESLint completed with no errors.
- Vitest completed with 2 test files and 3 tests passing.

## Bloque 1 Progress

### Implemented in this task

- Connected real React Router DOM through `BrowserRouter`, `Routes`, `Route`, and `NavLink`.
- Replaced the placeholder store with a real Redux Toolkit store in `src/app/store.js`.
- Replaced the placeholder `uiSlice` with a real `createSlice` implementation and exported selectors/actions.
- Connected the React Redux `Provider` in `src/main.jsx`.
- Added `src/services/api/axiosClient.js` with base URL, timeout, JSON headers, and response error normalization.
- Completed `src/services/errors/errorAdapter.js` to normalize Axios/backend errors.
- Added `src/services/errors/errorLogger.js` for dev console logging plus localStorage persistence.
- Connected the global `FeedbackModal` to Redux state and close action.
- Added placeholder routed pages so the Navbar navigates without breaking.
- Added basic Vitest + jsdom + React Testing Library setup.
- Added MSW node server bootstrap and handlers scaffold.
- Added baseline tests for `uiSlice` and `FeedbackModal`.
- Added `test` and `test:watch` scripts to `package.json`.

### Pending after Bloque 1

- Connect real feature services/pages on top of this base shell.
- Add route-level pages for group detail, team detail, stadium detail, and match detail when their scopes begin.
- Add the first environment documentation for `VITE_API_BASE_URL`.

## Risks and Constraints

- `axiosClient` is ready but not yet consumed by page-level services.
- `FeedbackModal` is wired globally, but no business flow dispatches it yet.
- `README.md` is still the default Vite template documentation and remains pending for later docs work.
- `docs/pages/` still does not exist; page docs remain directly under `docs/`.
- Backend URL configuration must still be provided through `VITE_API_BASE_URL` in the user environment.

## Next Recommended Build Mode Task

After Bloque 1 validation:

1. Start Bloque 1.2/1.3 integration work by adding service modules that use `axiosClient`.
2. Begin feature-specific page implementation for Home daily schedule and delayed-loading modal behavior.
3. Add the first environment documentation for `VITE_API_BASE_URL`.
4. Prepare the first backend-driven Home data flow and loading states.

## Bloque 1

- 1.1 Complete — configured the existing Vite + React app with React Router DOM and Redux Toolkit and validated it manually in WSL.
- 1.2 Complete — configured `axiosClient` with baseURL from `VITE_API_BASE_URL`, timeout, headers, and response interceptors and validated the build/lint/test baseline manually in WSL.
- 1.3 Complete — created errorAdapter, errorLogger and global FeedbackModal and validated the current baseline manually in WSL.
- 1.4 Complete — configured Vitest, React Testing Library, MSW and test setup and validated the current baseline manually in WSL.


## Visual Refresh Before Bloque 2

A visual refresh was applied before starting functional Bloque 2 work. This is a UI polish pass only and does not close Bloque 2.

Manual validation after the refresh passed in the user's WSL terminal:

- `pnpm run build` ✅
- `pnpm run lint` ✅
- `pnpm run test` ✅

Observed successful results:

- Production build completed successfully with Vite.
- ESLint completed with no errors.
- Vitest completed with 2 test files and 3 tests passing.

Scope completed:

- Added global design tokens for the tournament-inspired custom palette.
- Improved the app background with light gradients, abstract field-grid texture and soft glow details.
- Redesigned the sticky header and navigation with a glass surface, pill links and clear active state.
- Redesigned the Home hero with portfolio-ready copy, badges, chips and CSS-only abstract football/field visuals.
- Redesigned visible cards and placeholder pages with stronger hierarchy, accent bars, softer shadows and rounded surfaces.
- Refreshed FeedbackModal styling to match the new identity.

Constraints preserved:

- No official FIFA assets, logos, mascot, trophy, ball, or World Cup branding were used.
- No endpoints, services, Redux logic, business logic, data fetching, or architecture from Bloque 1 were changed.
- CSS Modules remain the styling pattern.
- Bloque 2 remains pending functional implementation and validation.


## Scope Alignment Before Bloque 2 Functional Work

Manual validation after the alignment passed in the user's WSL terminal:

- `pnpm run build` ✅
- `pnpm run lint` ✅
- `pnpm run test` ✅

Observed successful results:

- Production build completed successfully with Vite.
- ESLint completed with no errors.
- Vitest completed with 2 test files and 3 tests passing.

A documentation and navigation alignment pass was applied before continuing with functional Bloque 2 work.

Scope aligned:

- `AGENTS.md` now reflects Redux Toolkit/React Redux/testing stack as required, with MSW defined for API mocking when needed.
- Routing docs now align with the approved primary navigation: `/`, `/grupos`, `/posiciones`, `/eliminatorias`, `/predicciones`.
- `docs/project-requirements.md` now references the correct project name `fixture-mundial-front` and documents primary vs future/optional navigation scope.
- `Navbar` and route constants now show only approved primary entries.
- `AppRoutes` now prioritizes approved primary pages and keeps `/partidos`, `/equipos`, `/estadios` as optional/future placeholders.

Constraints preserved:

- No dependency changes.
- No API/fetch integration changes.
- No business logic changes.
- Bloque 2 remains pending functional implementation.


## Copy Alignment Cleanup Before Bloque 2 Functional Work

Manual validation after the copy cleanup passed in the user's WSL terminal:

- `pnpm run build` ✅
- `pnpm run lint` ✅
- `pnpm run test` ✅

Observed successful results:

- Production build completed successfully with Vite.
- ESLint completed with no errors.
- Vitest completed with 2 test files and 3 tests passing.

A copy-alignment cleanup was applied to remove remnants of the previous navigation scope from visible UI text.

Scope adjusted:

- Home hero title and hero chips now match the approved core navigation scope (`Fixture`, `Tablas`, `Eliminatorias`, `Predicciones`).
- Home feature-card copy was updated to remove internal/development wording and old-scope emphasis.
- `PlaceholderPage` kicker changed from internal-style wording to portfolio-ready wording.
- Primary placeholder route descriptions were aligned exactly with current roadmap copy for `/grupos`, `/posiciones`, `/eliminatorias`, and `/predicciones`.

Constraints preserved:

- No logic or data-layer changes.
- No backend integration or fetch changes.
- Optional future routes (`/partidos`, `/equipos`, `/estadios`) remain outside main navigation scope.
- Bloque 2 remains pending functional implementation.


## Football Menu Navbar Visual Experiment Before Bloque 2

A visual interaction update was applied to the Navbar before functional Bloque 2 work.

Scope adjusted:

- Replaced the previous horizontal navbar with a CSS-only football ball button that opens/closes the primary menu.
- Added local Navbar state for open/closed visual state only.
- Added Escape-key closing and outside-click closing.
- Preserved the approved primary navigation entries: `/`, `/grupos`, `/posiciones`, `/eliminatorias`, `/predicciones`.
- Kept `/partidos`, `/equipos`, and `/estadios` out of the primary Navbar.
- Added simple React Testing Library coverage for menu open/close, Escape, and outside click behavior.

Constraints preserved:

- No Redux changes for this local visual state.
- No API/fetch/backend integration changes.
- No business logic changes.
- No official FIFA assets or external images were used; the ball is CSS-only.
- Bloque 2 remains pending functional implementation.

Manual validation:

- `pnpm run build` passed on WSL.
- `pnpm run lint` passed on WSL.
- `pnpm run test` passed on WSL.
- Current test suite: 3 files passed, 5 tests passed.

## Header Branding Ball Integration Before Bloque 2

A follow-up visual identity update integrated the CSS-only football menu ball as the main header brand element.

Scope adjusted:

- Replaced the previous abstract header isotype with the CSS football menu button.
- Integrated the ball next to `Fixture Mundial 2026` so it works as both brand mark and menu trigger.
- Preserved the vertical menu with the approved primary entries: Inicio, Fixture, Tablas, Eliminatorias and Predicciones.
- Kept Partidos, Equipos and Estadios out of the primary Navbar.
- Adjusted global color tokens toward a sportier tournament-inspired identity using deep navy, red, green, cyan and light surfaces.
- Retouched header/menu styling while keeping CSS Modules and the existing visual refresh.

Constraints preserved:

- No official FIFA branding, logo, trophy, mascot, official ball design, or external image assets.
- No Redux, services, routes, Axios, backend integration, or business logic changes.
- No Bloque 2 functional implementation.
- Bloque 2 remains pending functional work.

Manual validation:

- `pnpm run build` passed on WSL.
- `pnpm run lint` passed on WSL.
- `pnpm run test` passed on WSL.
- Current test suite: 3 files passed, 5 tests passed.

## Yellow Card Premium Menu Refinement Before Bloque 2

A visual refinement was applied to the CSS football Navbar dropdown before functional Bloque 2 work.

Scope adjusted:

- Kept the CSS football as the menu trigger.
- Added a subtle overlay behind the open menu to improve contrast against the hero/background.
- Redesigned the dropdown panel as a premium yellow-card-inspired floating card.
- Improved panel border, depth, shadow and warm yellow surface treatment.
- Adjusted menu links for stronger contrast, clearer hover/focus states and a stronger active state.
- Preserved the approved primary navigation entries: Inicio, Fixture, Tablas, Eliminatorias and Predicciones.
- Kept Partidos, Equipos and Estadios out of the primary Navbar.

Constraints preserved:

- No official branding, external images or protected assets.
- No Redux, services, routes, Axios, backend integration or business logic changes.
- No Bloque 2 functional implementation.
- Bloque 2 remains pending functional work.

Manual validation:

- `pnpm run build` passed on WSL.
- `pnpm run lint` passed on WSL.
- `pnpm run test` passed on WSL.
- Current test suite: 3 files passed, 5 tests passed.

## Bloque 2

- Status: Complete and manually validated from the user's WSL terminal.
- Manual validation confirmed:
  - `pnpm run build` passed.
  - `pnpm run lint` passed.
  - `pnpm run test` passed.
  - Current test suite: 7 files passed, 15 tests passed.
- 2.1 Visual refresh applied before Bloque 2; functional layout behavior remains pending for feature-specific implementation.
- 2.2 Complete — created native JavaScript date utilities with `dateAdapter` and validated manually in WSL.
- 2.3 Complete — created reusable CSS Module skeleton loaders and validated manually in WSL.
- 2.4 Complete — UI slice keeps modal/global loading/delayed loading state, exposes selectors and was validated manually in WSL.

### Bloque 2 Functional Shared Foundation

Implemented before Home backend integration:

- Added `src/utils/dateAdapter.js` with helpers for display dates, display times, local ISO today, match sorting and match start/past checks.
- Added `src/utils/delayedLoading.js` with the shared 7-second delayed-loading threshold helper.
- Added reusable skeleton components:
  - `src/components/SkeletonCard/SkeletonCard.jsx`
  - `src/components/SkeletonList/SkeletonList.jsx`
- Kept skeleton styles encapsulated with CSS Modules.
- Extended `uiSlice` selectors for global loading and delayed loading state.
- Kept `FeedbackModal` ready for real delayed-loading and error flows.
- Added tests for date utilities, delayed-loading helper, skeleton components and UI selectors.

Confirmed ready for the next block:

- `dateAdapter`
- `delayedLoading` helper
- `SkeletonCard`
- `SkeletonList`
- `uiSlice` actions and selectors for global loading and delayed loading.

Constraints preserved:

- No real backend fetch was added.
- No backend integration was started.
- No routes, Navbar, hero or visual refresh work was changed.
- No dependencies were installed.
- No Bloque 2 completion until the user validates manually.

Manual validation:

- `pnpm run build` passed on WSL.
- `pnpm run lint` passed on WSL.
- `pnpm run test` passed on WSL.
- Current test suite: 7 files passed, 15 tests passed.

## Bloque 3 Home Layout Direction

The current Home hero must remain the primary presentation section.

Approved Home structure for Bloque 3:

1. Current visual hero.
2. `DailyScheduleCard` immediately below the hero:
   - Title: `Partidos de hoy`.
   - If `today` is empty, show `Próxima fecha disponible`.
   - Render up to 8 matches.
   - Show skeleton while loading.
   - Trigger `FeedbackModal` when loading exceeds 7 seconds.
   - Show friendly error state if the request fails.
   - Show empty state when both `today` and `next` are empty.
3. Section: `Qué hace la app`.
4. Section: `Cómo usarla`.

Placement constraints:

- Do not put matches inside the header.
- Do not put matches inside the Navbar.
- Do not replace the current hero.
- The match card must be the first functional section below the hero.

## Bloque 3

- 3.1 Pending — implement Home with `/api/matches/schedule/daily`.
- 3.2 Pending — show `today` and, if empty, show `next`.
- 3.3 Pending — create “qué hace la app” and “cómo usarla” sections.

## Bloque 4

- 4.1 Pending — implement Group Fixtures.
- 4.2 Pending — selector de grupo A-L.
- 4.3 Pending — renderizar 6 partidos por grupo con escudos, estadio y marcador.

## Bloque 5

- 5.1 Pending — implement Group Standings.
- 5.2 Pending — renderizar cards por grupo.
- 5.3 Pending — mostrar posiciones 1, 2 y 3 según backend.
- 5.4 Pending — integrar refresh/reload tras cambios de resultados oficiales.

## Bloque 6

- 6.1 Pending — implement Knockout Stage with placeholders.
- 6.2 Pending — create bracket skeleton adapter for matches 73-104.
- 6.3 Pending — mark view as “en construcción” if qualified teams are missing.

## Bloque 7

- 7.1 Pending — implement Prediction Fixture.
- 7.2 Pending — save predictions in localStorage.
- 7.3 Pending — lock editing if the match already started or finished.
- 7.4 Pending — calculate scoring derived from official results.
- 7.5 Pending — add printing with `window.print()`.

## Bloque 8

- 8.1 Pending — write page documentation.
- 8.2 Pending — review minimum coverage for slices, utils and pages.
- 8.3 Pending — consolidate decisions in Engram memory.
