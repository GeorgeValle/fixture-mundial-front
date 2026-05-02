# Project Task Board

## Current Status

- Current block: Bloque 8 — Documentation and Final Review.
- Last completed block: Bloque 7 — Prediction Fixture.
- Next recommended task: review documentation, test coverage, README, portfolio summary and final branding polish.
- Manual validation status: Bloque 7 was manually validated by the user and approved.

## Critical Execution Rules

- Use the Orchestrator Agent from `AGENTS.md`.
- Read `docs/project-requirements.md`.
- Read the relevant page-specific MD before changing any page.
- Read `DESIGN.md` before making visual, layout, or shared UI component changes.
- Keep page-specific logic in the page-specific MD.
- Add or update tests when behavior changes.
- Codex must not run runtime commands if WSL toolchain is not guaranteed.
- The user performs final manual validation from WSL.

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
- [x] Follow-up completed: format `nextDate` with a friendly Spanish/Argentina date format.

### Bloque 5 — Group Standings
- [x] Confirm backend response shape for `GET /api/standings`.
- [x] Implement standings service/schema.
- [x] Implement `/posiciones` page.
- [x] Render standings cards/tables by group.
- [x] Add loading, empty, error and delayed-loading states.
- [x] Add tests.
- [x] User manual validation.
- [x] Note: Bloque 5 was approved visually/manually by the user before starting Bloque 6.

### Bloque 6 — Knockout Stage
- [x] Review knockout documentation and skeleton source.
- [x] Create local knockout skeleton data.
- [x] Implement backend/skeleton merge strategy.
- [x] Implement `/eliminatorias` page.
- [x] Implement round selector.
- [x] Implement bracket, round, and match-card components.
- [x] Render visible UI labels in Spanish.
- [x] Handle loading, delayed loading, error, empty/skeleton, and partial-data states.
- [x] Add adapter and render tests.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run test`.
- [x] Document page-specific decisions in `docs/knockout-stage.md`.
- [x] User manual validation.

Note: detailed Knockout Stage rules, backend/skeleton merge behavior, UI labels, validation results, and backlog notes are documented in `docs/knockout-stage.md`.

### Bloque 7 — Prediction Fixture
- [x] Review `docs/prediction-fixture.md`.
- [x] Review `docs/API-Backend-Mundial-2026.md`.
- [x] Confirm public match endpoints used by Prediction Fixture.
- [x] Define localStorage model for predictions.
- [x] Implement user name capture.
- [x] Implement prediction cards for group-stage matches.
- [x] Keep knockout predictions closed until real knockout matches exist.
- [x] Prevent predictions over placeholders or skeleton-only knockout matches.
- [x] Implement prediction locking by match `status`.
- [x] Implement prediction locking by match `date`.
- [x] Implement group-stage scoring.
- [x] Implement knockout scoring.
- [x] Implement penalty prediction validation.
- [ ] Implement penalty prediction fields for knockout ties.
- [x] Compare user prediction against official result when match is finished.
- [x] Show user prediction and official result in finished matches.
- [x] Show points obtained per match.
- [x] Show success indicators for matched conditions.
- [x] Implement corrupt localStorage safe parsing/reset support.
- [x] Handle corrupt localStorage with guided reset.
- [x] Add print support with `window.print()`.
- [x] Add tests for scoring, locking, localStorage and validation.
- [x] Add tests for UI states.
- [x] Add tests for print.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run test`.
- [x] User manual validation.

Sub-block 7.1 — Prediction Core implemented the storage model, storage service,
schemas, locking utilities, scoring utilities, prediction validation and unit tests.
Validation for this sub-block passed with `pnpm run build`, `pnpm run lint` and
`TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` on the WSL Node 24 toolchain.

Sub-block 7.2 — Prediction UI Base implemented `/predicciones`, user name capture,
group-stage prediction cards, localStorage editing, locked states, finished-match
comparison, points, success indicators, knockout-closed panel, corrupt-storage
guided reset, loading/delayed-loading/error/empty states and UI tests. The print
flow, final polish and manual validation remain pending. Validation for this
sub-block passed with `pnpm run build`, `pnpm run lint` and
`TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`.

Follow-up UI polish: added a group filter selector and adjusted visible copy for
`/predicciones`. Manual validation remains pending for Bloque 7.3.

Sub-block 7.3 added print support, print tests and final UI polish for
`/predicciones`. Validation passed with `pnpm run build`, `pnpm run lint` and
`TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`. User manual validation remains
pending.

Follow-up 7.4 added reset controls to clear editable predictions by selected
group or all groups while preserving locked predictions.

Follow-up 7.5 improved prediction summary by phase, added scoring help modals,
knockout phase filter, custom reset confirmation modals and print layout polish.

Follow-up 7.5.1 added browser-safe score input validation, participant name
validation and replaced technical knockout copy with user-friendly text.

Bloque 7 was manually validated by the user and approved. Penalty prediction
fields for knockout ties are deferred until real knockout matches are available
from the backend.

Note: detailed Prediction Fixture rules, scoring behavior, locking rules, and backend data requirements belong in `docs/prediction-fixture.md`, not in this task board.

### Bloque 8 — Documentation and Final Review
- [ ] Review page documentation.
- [ ] Review test coverage.
- [ ] Consolidate project decisions.
- [ ] Prepare README/portfolio documentation.

## Page Documentation Index

- Home: `docs/home.md`
- Group fixtures: `docs/group-fixtures.md`
- Group standings: `docs/group-standings.md`
- Knockout stage: `docs/knockout-stage.md`
- Prediction fixture: `docs/prediction-fixture.md`
- Design system: `DESIGN.md`
- Backend API: `docs/API-Backend-Mundial-2026.md`

## Manual Validation Checklist

The user runs from WSL:

```bash
which node
which pnpm
type -a node
type -a pnpm
pnpm run build
pnpm run lint
pnpm run test
```
