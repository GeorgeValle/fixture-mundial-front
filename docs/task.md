# Project Task Board

## Current Status

- Current block: Bloque 5 — Group Standings view selector implemented; pending final validation review.
- Last completed block: Bloque 4 — Home Daily Schedule.
- Next recommended task: User visual/manual validation review for Bloque 5 standings view modes.
- Manual validation status: Bloque 5 passed Codex WSL build, lint and test validation; user manual validation may still be performed.

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
- [ ] User manual validation.

### Bloque 6 — Knockout Stage
- [ ] Implement bracket skeleton.
- [ ] Handle missing qualified teams.
- [ ] Add tests.
- [ ] User manual validation.

### Bloque 7 — Prediction Fixture
- [ ] Implement prediction flow.
- [ ] Persist predictions in localStorage.
- [ ] Lock predictions after match start.
- [ ] Calculate score from official results.
- [ ] Add print support.
- [ ] Add tests.
- [ ] User manual validation.

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
