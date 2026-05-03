# Project Task Board

## Current Status

- Current block: Bloque 8 — Documentation and Final Review.
- Last completed block: Bloque 7 — Prediction Fixture.
- Goal: leave the project ready for GitHub, portfolio presentation and final technical review.
- Manual validation status: Bloque 7 was manually validated by the user and approved.

## Critical Execution Rules

- Work inside the existing React + Vite project.
- Use JavaScript, CSS Modules and pnpm only.
- Do not recreate or scaffold the project.
- Do not document administrative backend routes as public frontend usage.
- Keep long page details in page-specific docs.
- Keep this file as a short board/checklist.
- Build/lint/test must be executed only in QA Mode or final validation.

## Block Checklist

### Bloque 1 — Base Architecture

- [x] Router configured.
- [x] Redux Toolkit configured.
- [x] Axios client configured.
- [x] Global error/feedback base configured.
- [x] Base tests configured.

### Bloque 2 — Shared UI Foundation

- [x] Date utilities.
- [x] Skeleton loaders.
- [x] Delayed loading helpers.
- [x] Shared UI state selectors.

### Bloque 3 — Group Fixtures

- [x] `/grupos` page implemented.
- [x] Group selector implemented.
- [x] Fixture match cards implemented.
- [x] Backend match parsing implemented.
- [x] Tests added and manually validated.

### Bloque 4 — Home Daily Schedule

- [x] Daily schedule endpoint integrated.
- [x] Today/next fallback implemented.
- [x] Loading, delayed loading, empty and error states implemented.
- [x] Tests added and manually validated.
- [x] Follow-up completed: format `nextDate` with a friendly Spanish date format.

### Bloque 5 — Group Standings

- [x] Confirm public backend response shape for `GET /api/standings`.
- [x] Implement standings service/schema.
- [x] Implement `/posiciones` page.
- [x] Render standings cards/tables by group.
- [x] Add loading, empty, error and delayed-loading states.
- [x] Add tests.
- [x] User manual validation.

### Bloque 6 — Knockout Stage

- [x] Review knockout documentation and skeleton source.
- [x] Create local knockout skeleton data.
- [x] Implement backend/skeleton merge strategy.
- [x] Implement `/eliminatorias` page.
- [x] Implement round selector.
- [x] Implement bracket, round and match-card components.
- [x] Render visible UI labels in Spanish.
- [x] Handle loading, delayed loading, error, empty/skeleton and partial-data states.
- [x] Add adapter and render tests.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run test`.
- [x] User manual validation.

### Bloque 7 — Prediction Fixture

- [x] Define localStorage prediction model.
- [x] Implement prediction storage, schemas, locking, scoring and validation utilities.
- [x] Implement `/predicciones` UI base.
- [x] Implement user name capture.
- [x] Implement prediction cards for group-stage matches.
- [x] Keep knockout predictions closed until real knockout prediction flow is approved.
- [x] Prevent predictions over placeholders or skeleton-only knockout matches.
- [x] Implement prediction locking by `status` and `date`.
- [x] Implement group-stage scoring.
- [x] Implement knockout scoring utilities.
- [x] Implement penalty prediction validation utilities.
- [ ] Implement visible penalty prediction fields for knockout ties.
- [x] Compare user prediction against registered final result when match is finished.
- [x] Show user prediction, registered final result, points and indicators.
- [x] Handle corrupt localStorage with guided reset.
- [x] Add group filter.
- [x] Add reset controls for selected group and all editable predictions.
- [x] Add print support with `window.print()`.
- [x] Add summary/help modals and final UI polish.
- [x] Add tests for scoring, locking, localStorage, validation, UI states and print.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run test`.
- [x] User manual validation.

Note: visible penalty fields for knockout predictions are deferred until real knockout prediction UI is approved.

### Bloque 8 — Documentation and Final Review

- [x] Review current documentation.
- [x] Replace generic Vite README with project README.
- [x] Create public frontend API contract.
- [x] Update page-specific documentation.
- [x] Clean task board and documentation index.
- [x] Align project requirements with current scope.
- [ ] Optional future copy polish in visible UI.
- [ ] Final QA Mode validation.

## Documentation Index

- Main README: `README.md`
- Project requirements: `docs/project-requirements.md`
- Public API contract: `docs/api-contract.md`
- Home: `docs/home.md`
- Group fixtures: `docs/group-fixtures.md`
- Group standings: `docs/group-standings.md`
- Knockout stage: `docs/knockout-stage.md`
- Knockout skeleton reference: `docs/knockout-stage-skeleton.md`
- Prediction fixture: `docs/prediction-fixture.md`
- Expanded backend reference: `docs/API-Backend-Mundial-2026.md`
- Design system: `DESIGN.md`

## Final QA Checklist

Run only when QA Mode or final validation is approved.

### WSL runtime preflight

```bash
source ~/.nvm/nvm.sh && nvm use 24
which node
which pnpm
type -a node
type -a pnpm
```

Expected active runtime must resolve first to Linux-native WSL paths under `/home/yorch/.nvm/versions/node/...`.

### Automated checks

```bash
pnpm run build
pnpm run lint
pnpm run test
```

If Vitest uses a Windows temp path from WSL, use Linux temp variables:

```bash
TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test
```

### Manual review

- [ ] `/` Home.
- [ ] `/grupos` Fixture de grupos.
- [ ] `/posiciones` Tabla de posiciones.
- [ ] `/eliminatorias` Eliminatorias.
- [ ] `/predicciones` Predicciones.
- [ ] Responsive mobile/tablet/desktop.
- [ ] Loading states.
- [ ] Delayed loading modal.
- [ ] Error states.
- [ ] Empty states.
- [ ] Textos visibles en español.
- [ ] No raw technical backend errors in UI.
- [ ] README links and commands.
- [ ] Public API docs do not present administrative routes as frontend usage.

## Optional Future Copy Polish

Pending optional subtask: replace visible technical copy in source after documentation closure.

Suggested replacements:

- `backend` → `servidor`, `datos de la base de datos` or `información recibida`.
- `API` → `datos recibidos` or `fuente de datos`.
- `skeleton` → `estructura base` or `cuadro base`.
- `placeholders` / `TBD` → `equipos por definir`.
- `PENDING` → `Pendiente`.
- `Portfolio project` → `Proyecto de portfolio`.
- `International football experience` → `Experiencia de fútbol internacional`.
- `Kickoff ready` → `Listo para el inicio`.
- `World football tracker` → `Seguimiento del Mundial`.
