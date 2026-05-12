# Project Task Board

## Current Status

- Current block: none — Bloque 16 fue implementado y validado automáticamente.
- Last completed planning block: Bloque 15 — Admin Transition Controls.
- Last completed admin implementation block: Bloque 16 — Admin Team Corrections.
- Last completed implementation block: Bloque 16 — Admin Team Corrections.
- Estado actual: Bloque 14 fue activado con recálculo manual confirmado (`POST /api/standings/:group`) y validado como seguimiento operativo de admin.
- Next suggested block after approval/completion: Bloque 17 — Admin Knockouts Controls & Public Knockout Polish.
- Goal: permitir correcciones excepcionales de `position`, `qualifiedTo` y `shieldUrl` desde `/admin/teams-corrections`, usando `PUT /api/teams/:id` con cookie admin y sin crear/eliminar equipos.
- Manual validation status: Bloque 16 pasó validación automática (`pnpm run lint`, `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`; 35 test files, 352 tests, y `pnpm run build`). Queda pendiente validación manual de usuario contra backend real si corresponde.

## Critical Execution Rules

- Work inside the existing React + Vite project.
- Use JavaScript, CSS Modules and pnpm only.
- Do not recreate or scaffold the project.
- Do not document administrative backend routes as public frontend usage.
- Keep long page details in page-specific docs.
- Keep this file as a short board/checklist.
- Build/lint/test must be executed only in QA Mode or final validation.
- Admin Zone planning lives in `docs/admin-dashboard.md`; do not implement admin source files until the relevant block is approved.

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
- [x] Optional future copy polish in visible UI.
- [x] Final QA Mode validation.


### Bloque 9 — Visual Polish, Accessibility and Production Readiness

- [x] Review `DESIGN.md` before visual changes.
- [x] Document Block 9 scope and QA checklist.
- [x] Increase Axios timeout to support slow server wake-up copy.
- [x] Add human slow-server copy explaining wake-up can take up to 30 seconds.
- [x] Add retry buttons to backend-powered error states.
- [x] Replace visible technical copy such as backend/skeleton/placeholders where user-facing.
- [x] Add favorite group persistence with localStorage.
- [x] Use favorite group as initial group in `/grupos` and `/posiciones`.
- [x] Add custom 404 page for route `*`.
- [x] Polish cards, state containers, badges, headers and spacing.
- [x] Add subtle decorative CSS/SVG-style details without harming readability.
- [x] Improve accessibility for modals and new favorite/retry/404 buttons.
- [x] Add basic installable PWA manifest, icons and theme color.
- [x] Update favicon, title, meta description and Open Graph metadata.
- [x] Add or update tests for 404, favorite group, retry/loading copy and key accessibility behaviors.
- [x] Final QA Mode validation after implementation.


### Bloque 10 — Onboarding, Navbar and Progressive UI Polish

- [x] Review `DESIGN.md`, `docs/task.md` and Block 9 documentation before visual changes.
- [x] Verify WSL Node/pnpm runtime before implementation.
- [x] Verify SVG asset filenames and references.
- [x] Normalize stadium illustration filename to lowercase when confirmed unused.
- [x] Create Block 10 documentation.
- [x] Implement Part 1 — Onboarding, Navbar and SVG Assets.
- [x] Add Home first-visit tutorial with localStorage persistence.
- [x] Add manual `Ver tutorial` entry point from Navbar.
- [x] Replace Navbar ball visual with `soccerballnoshadow.svg` while preserving menu logic.
- [x] Use `silbato-web.svg` for the tutorial/help button.
- [x] Preserve `aria-label`, `aria-expanded`, `aria-controls`, Escape behavior and focus-visible states.
- [x] Add tests for Part 1 behavior.
- [x] Run final validation for Part 1.
- [x] Fix manual validation issue where the Home tutorial rendered below page elements and blocked/failed button clicks.
- [x] Fix second manual validation issue: align spotlight to real `data-tour` targets, avoid panel/target overlap and prevent tutorial from competing with feedback/loading overlays.
- [x] Fix third manual validation issue: keep the `home-sections` tutorial step stable with fixed panel placement and conservative scroll.
- [x] User manual validation of corrected Part 1 tutorial UI.
- [x] Implement Part 2 — Home, Group Fixtures and Standings Refinement.
- [x] Convert Home chips into real quick links.
- [x] Refine Home hero visual balance.
- [x] Refine `/grupos` top control panel and safe group summary.
- [x] Refine `/posiciones` hero and standings control panel.
- [x] Add/update Part 2 tests.
- [x] Implement Part 3 — Knockout, Predictions, Consistency and Tests.
- [x] Refine `/eliminatorias` as Camino a la final without inventing data.
- [x] Add accessible knockout round chips synchronized with the select filter.
- [x] Refine `/predicciones` as a predictions dashboard without changing scoring/storage.
- [x] Apply controlled consistency polish for chips, badges, cards, focus states and danger zone in Part 3 scope.
- [x] Add/update Part 3 tests.
- [x] Block 10 ready for final QA review.
- [x] Run final QA validation for Block 10.
- [x] Close Block 10.

### Bloque 11 — Admin Zone Planning & Backend Engine Alignment

- [x] Create `docs/admin-dashboard.md`.
- [x] Align the Admin Zone plan with Standings, Transition and Bracket backend engines.
- [x] Define admin routes, sectors, services, components and flow.
- [x] Register legacy inconsistencies that need normalization before or during implementation.
- [x] Keep this block documentation-only; no `src/` changes, build, lint or tests.

### Bloque 12 — Admin Auth & Protected Layout

- [x] Implement `/admin/login`.
- [x] Implement `/admin` and `/admin/dashboard` redirects.
- [x] Implement `AdminProtectedRoute`.
- [x] Implement `AdminLayout` with sidebar.
- [x] Implement `authSlice` or equivalent auth state.
- [x] Implement login/logout with `HttpOnly` cookie and `withCredentials`.
- [x] Restore session with `GET /api/auth/me` if available.
- [x] Add admin auth/routing tests.
- [x] Final fix: logout sends `{}` with `withCredentials`, clears Redux auth state and redirects to `/admin/login`.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` after default Vitest temp path failed under `/mnt/c`.

### Bloque 13 — Admin Match Result Controls

- [x] Implement `/admin/matches`.
- [x] List and filter matches by group, stage and status.
- [x] Load regular goals and status.
- [x] Handle `PLAYING` and `FINISHED`.
- [x] Load penalties for tied knockout matches.
- [x] Send partial payloads with `PUT /api/matches/:id`.
- [x] Refresh matches after save.
- [x] Do not move teams or recalculate brackets from React.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` (28 test files, 289 tests).

### Bloque 14 — Admin Groups & Standings Controls

- [x] Implement `/admin/groups` as a protected admin route.
- [x] Enable `Grupos` in the admin sidebar.
- [x] Load admin matches with `GET /api/matches` and explicit `withCredentials` from `adminMatchesService`.
- [x] Load standings with `GET /api/standings` and explicit `withCredentials` from `adminStandingsService`.
- [x] Show group selector A-L.
- [x] Show operational counts by status: `PENDING`, `PLAYING`, `FINISHED` and expected group total.
- [x] Normalize legacy `IN_PROGRESS` defensively to `PLAYING` for counts.
- [x] Show current standings for the selected group as official backend data.
- [x] Show loading, empty, error and retry states.
- [x] Habilitar recálculo manual con `POST /api/standings/:group` para grupos completos (6 partidos finalizados).
- [x] Do not calculate standings, best third places, qualifiers or `qualifiedTo` in React.
- [x] Do not implement transition, team corrections, knockout controls or bracket modification.
- [x] Add tests for route protection, data loading, group selector, status counts, empty/error/retry, confirmación/cancelación, recálculo y refresh.
- [x] Register manual confirmation and no POST without confirmation in tests.
- [x] Run `pnpm run build`.
- [x] Run `pnpm run lint`.
- [x] Run `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` (35 test files, 352 tests).

### Bloque 15 — Admin Transition Controls

- [x] Planificar el flujo grupos → 16avos en Plan Mode.
- [x] Documentar que no se implementó código, servicios, componentes ni rutas en este bloque.
- [x] Revisar docs y código existente: standings, knockout, admin groups, servicios admin y patrón `withCredentials`.
- [x] Confirmar que la app pública `/eliminatorias` ya lee `GET /api/matches` y mergea datos reales con skeleton sin ejecutar lógica admin.
- [x] Definir `/admin/transition` como ubicación recomendada para no mezclar revisión de standings con siembra de eliminatorias.
- [x] Registrar que la acción real debe ser admin-only y no debe aparecer en rutas públicas.
- [x] Registrar que el frontend no debe calcular standings, mejores terceros, desempates, `qualifiedTo` ni mapping definitivo de 16avos.
- [x] Registrar contrato backend pendiente antes de habilitar mutaciones reales, aunque la documentación disponible mencione `POST /api/admin/classify-group`.
- [x] Confirmar con backend la ruta real, método y body de `POST /api/admin/classify-group`; quedan como consideraciones operativas los detalles de idempotencia completa y casos de negocio.
- [ ] Confirmar si el contrato expone una preview de clasificados o si la preview debe ser read-only desde `GET /api/standings` + `GET /api/matches`.
- [ ] Confirmar cómo se resuelven mejores terceros, empates absolutos, Fair Play/sorteos y slots tipo `3rd Group A/B/C/D/F`.
- [x] En Build Mode, crear `AdminTransitionPage` protegida en `/admin/transition`.
- [x] En Build Mode, habilitar `Transición` en el sidebar como pantalla de revisión/preview.
- [x] En Build Mode, crear `adminTransitionService` con lecturas `GET /api/standings` y `GET /api/matches`, ambas con `withCredentials: true`.
- [x] En Build Mode, no crear función activa `transitionGroupsToKnockout` para evitar mutaciones accidentales con contrato pendiente.
- [x] En Build Mode, mostrar estado inicial, loading, error, empty, preview read-only y acción deshabilitada por contrato pendiente.
- [x] En Build Mode inicial, mantener bloqueada la acción real `Ejecutar transición a 16avos` hasta confirmar contrato backend.
- [x] En Build Mode, agregar botón `Refrescar datos` para recargar standings y partidos sin mutar backend.
- [x] En Build Mode, agregar tests de ruta protegida, acción deshabilitada, preview, no POST sin contrato, `withCredentials` y ausencia de controles admin en UI pública.
- [x] Registrar resultado final de `pnpm run lint` — passed.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 32 test files, 310 tests passed en la primera implementación segura.
- [x] Registrar resultado final de `pnpm run build` — passed con warning Vite de chunk mayor a 500 kB.
- [x] Follow-up Block 15: habilitar transición manual por grupo dentro de `/admin/transition`.
- [x] Confirmar contrato backend para transición manual: `POST /api/admin/classify-group` con body `{ group: "A" }`.
- [x] Agregar selector `Grupo a procesar` con opciones A-L y valores enviados `A`-`L`.
- [x] Habilitar `Ejecutar transición a 16avos` solo cuando hay grupo seleccionado y no hay carga/request en curso.
- [x] Agregar confirmación previa con el grupo seleccionado antes de enviar el POST.
- [x] Implementar `processGroupTransition(group)` con `axiosClient.post('/api/admin/classify-group', { group }, { withCredentials: true })`.
- [x] Mantener React como disparador administrativo: no envía teams, standings, posiciones ni slots; no calcula clasificados, mejores terceros, desempates ni mapping.
- [x] Mostrar success/error devueltos por backend y fallback claro en español.
- [x] Refrescar standings y matches después de una transición exitosa manteniendo seleccionado el grupo procesado.
- [x] Actualizar tests de servicio y página para selector, confirmación, cancelación, success/error, refresh y payload mínimo.
- [x] Registrar resultado final de `pnpm run lint` del follow-up — passed.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` del follow-up — 32 test files, 317 tests passed.
- [x] Registrar resultado final de `pnpm run build` del follow-up — passed con warning Vite de chunk mayor a 500 kB.

### Bloque 16 — Admin Team Corrections

- [x] Planificar Bloque 16 sin tocar `src/` ni ejecutar build/lint/test.
- [x] Identificar que el siguiente paso lógico es `/admin/teams-corrections` porque la transición manual ya existe y puede requerir correcciones excepcionales de equipos antes de reprocesar un grupo.
- [x] Documentar que el uso debe ser excepcional: empates absolutos, Fair Play/sorteos, mejores terceros, corrección de `qualifiedTo` o `shieldUrl`.
- [x] Confirmar que React no debe calcular standings, clasificados, mejores terceros, desempates ni mapping de cruces.
- [x] Registrar contratos confirmados para lectura de equipos: `GET /api/teams`, `GET /api/teams/:id` y `GET /api/teams/name/:name`.
- [x] Confirmar contrato real de mutación: `PUT /api/teams/:id`, protegido en backend por `verifyAdmin`; no usar `/api/admin/teams/:id`.
- [x] Confirmar payload permitido para corrección de equipo: `position`, `qualifiedTo`, `shieldUrl`; `qualifiedTo` acepta valores canónicos o `null`.
- [x] Implementar `/admin/teams-corrections` como ruta protegida.
- [x] Habilitar `Correcciones` en el sidebar.
- [x] Crear servicio admin de equipos con `axiosClient` y `withCredentials: true` explícito.
- [x] Listar/filtrar equipos por grupo y búsqueda usando `GET /api/teams`.
- [x] Permitir editar únicamente `position`, `qualifiedTo` y `shieldUrl`; no editar `name`, `group`, `confederation` ni `_id`.
- [x] Enviar payload parcial limpio y pedir confirmación fuerte antes de guardar.
- [x] Mostrar success/error en español y sugerir reprocesar el grupo en `/admin/transition` cuando corresponde.
- [x] Agregar tests de ruta protegida, servicio, payload parcial, confirmación/cancelación, estados loading/error/empty, `withCredentials` y no exposición pública.
- [x] Registrar resultado final de `pnpm run lint` — passed.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 35 test files, 352 tests passed.
- [x] Registrar resultado final de `pnpm run build` — passed con warning Vite de chunk mayor a 500 kB.

### Bloque 17 — Admin Knockouts Controls & Public Knockout Polish

- [ ] Implement `/admin/knockouts` or integrate knockout filtering into `/admin/matches`.
- [ ] Show `matchNumber`, placeholders, `nextMatchWinner` and `nextMatchLoser`.
- [ ] Load knockout results and penalties.
- [ ] Confirm public `/eliminatorias` renders updated data from `GET /api/matches`.
- [ ] Confirm knockout predictions only enable with real `homeTeam` and `awayTeam`.

## Admin Zone Normalization Watchlist

- `docs/worldcup2026/*` backend documents requested for review are not present in the workspace; root-level backend docs were used instead.
- Some backend docs use legacy or conflicting admin endpoints. Current confirmed admin implementation contract is:
  - `PUT /api/matches/:id`
- Contracts to confirm before future admin blocks:
  - recálculo de standings bloqueado por contrato sin resolver? `POST /api/standings/:group` quedó confirmado y habilitado; revisar si requiere body y/o retorna standings actualizados.
  - team corrections: contrato confirmado `PUT /api/teams/:id`, protegido por `verifyAdmin`; no usar `PUT /api/admin/teams/:id`, `POST /api/teams` ni endpoints de creación
  - group transition: contrato confirmado para `POST /api/admin/classify-group` con body `{ group }`; frontend solo dispara por grupo con cookie admin y backend ejecuta `TransitionService.allocateGroupQualifiers(group)`
  - team listing: no usar `GET /api/teams/group/:group`; para `/admin/teams-corrections` usar `GET /api/teams` y filtro por grupo en frontend.
- Legacy `qualifiedTo` values need normalization:
  - `16AVOS` -> `ROUND_OF_32`
  - `OCTAVOS` -> `ROUND_OF_16`
  - `CUARTOS` -> `QUARTER_FINALS`
  - `SEMIFINAL` -> `SEMI_FINALS`
  - `3RO` -> `THIRD_PLACE_MATCH`
  - `ELIMINADO` -> `ELIMINATED`
- Legacy match status needs normalization:
  - `IN_PROGRESS` -> `PLAYING`
- Legacy team image field needs normalization:
  - `flagUrl` -> `shieldUrl`

## Documentation Index

- Main README: `README.md`
- Project requirements: `docs/project-requirements.md`
- Public API contract: `docs/api-contract.md`
- Admin Zone planning: `docs/admin-dashboard.md`
- Home: `docs/home.md`
- Group fixtures: `docs/group-fixtures.md`
- Group standings: `docs/group-standings.md`
- Knockout stage: `docs/knockout-stage.md`
- Knockout skeleton reference: `docs/knockout-stage-skeleton.md`
- Prediction fixture: `docs/prediction-fixture.md`
- Expanded backend reference: `docs/API-Backend-Mundial-2026.md`
- Backend API notes: `docs/api-back.md`
- Standings Engine: `docs/Backed_Standings_Engine.md`
- Bracket Engine: `docs/Backend_Bracket_Engine.md`
- Transition Engine: `docs/Backend_Transition_Engine.md`
- Design system: `DESIGN.md`
- Block 9 polish/readiness: `docs/block-9-polish.md`
- Block 10 onboarding/UI polish: `docs/block-10-onboarding-and-ui-polish.md`

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
- [ ] Delayed loading modal and server wake-up copy.
- [ ] Error states with retry buttons.
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
