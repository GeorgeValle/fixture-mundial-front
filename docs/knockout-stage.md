# Knockout Stage

## Page Agent Contract

This document is the source of truth for the `/eliminatorias` page.

Any agent working on this page must read:

1. `docs/project-requirements.md`
2. `docs/task.md`
3. this page document
4. `docs/knockout-stage-skeleton.md`
5. `docs/API-Backend-Mundial-2026.md` when backend data is involved
6. `DESIGN.md` before visual, layout, or shared UI changes

The page implementation must follow the task IDs assigned in `docs/task.md`.

Behavior changes require tests.

## Objetivo

Mostrar la fase eliminatoria del Mundial 2026 desde el partido 73 al 104.

The page should let users understand the path to the final while clearly distinguishing:

- official backend/database data;
- documented skeleton fallback data;
- visual placeholders for teams or results that are not official yet.

The page must not invent qualified teams, results, goals, penalties, winners, losers, or real bracket progressions that are not confirmed by backend data.

## Fuente de datos

The page uses two data sources:

1. **Backend/database** through `GET /api/matches`.
2. **Documented skeleton fallback** derived from `docs/knockout-stage-skeleton.md`.

The local implementation of the documented fallback lives in:

- `src/data/knockoutStageSkeleton.js`

The backend/database remains the source of truth whenever it provides real data.

## Skeleton documentado

`docs/knockout-stage-skeleton.md` defines the initial structural reference for the knockout stage:

- match numbers 73–104;
- rounds;
- dates;
- stadiums;
- home/away placeholders;
- bracket flow between rounds.

The skeleton is not final match data. It is only used to render a complete initial bracket while official data is missing or incomplete.

The skeleton must not replace real backend data.

## Prioridad de datos

Data priority is:

1. Backend/database data.
2. Skeleton fallback from `docs/knockout-stage-skeleton.md` / `src/data/knockoutStageSkeleton.js`.
3. Clear visual placeholders.

Rules:

- Real backend data always has priority over skeleton data.
- The skeleton only completes missing presentation fields such as date, round label, stadium, placeholders, and status labels.
- If backend data is empty, render the documented skeleton.
- If backend data is partial, merge real matches with skeleton fallback.
- If matching is unsafe, keep the skeleton placeholder.

## Identificación de partidos

Each skeleton match has stable internal identifiers:

- `matchNumber`, for example `73`, `74`, `101`, `104`.
- `templateCode`, for example `KO-73`, `KO-74`, `KO-101`, `KO-104`.
- `roundKey`, for example `round-of-32`, `round-of-16`, `quarter-finals`.

Backend/skeleton matching follows this order:

1. Match by backend `matchNumber` when available.
2. Match by backend `templateCode` when `matchNumber` is unavailable.
3. Match by a normalized compound fallback key only when the backend does not provide an explicit identity.

The compound fallback key uses:

- round;
- date;
- stadium.

Normalization reduces mismatch risk caused by casing, spaces, accents, and simple stadium naming differences. If the compound match is ambiguous or insecure, do not replace the placeholder.

## Estrategia de merge backend/skeleton

The merge strategy is implemented in:

- `src/utils/knockoutStageAdapter.js`

Merge rules:

- Backend has priority for teams, score, penalties, and status.
- Skeleton may complete missing presentation fields.
- Real teams render only when backend provides them.
- Regular score renders only when backend provides both `homeScore` and `awayScore` as numbers.
- Penalties render only when backend provides both `homePenaltyScore` and `awayPenaltyScore` as numbers.
- A winner is derived only when backend data is complete enough:
  - `status === 'FINISHED'`;
  - regular score is complete;
  - if regular score is tied, penalty score is complete.
- Winners, losers, qualified teams, and future-round placements are never invented from incomplete data.

## Reglas de placeholders

Placeholders must be visibly understood as unresolved data, not confirmed teams.

Examples:

- `2º Grupo A`
- `3º Grupo A/B/C/D/F`
- `Ganador Partido 74`
- `Perdedor Partido 101`
- `Equipo por definir`
- `Sin datos oficiales`

When backend data does not provide a real team for a slot, render the documented placeholder.

## Reglas de progresión del bracket

The skeleton includes progression placeholders such as:

- `Ganador Partido 74`
- `Ganador Partido 77`
- `Perdedor Partido 101`
- `Perdedor Partido 102`

Current Block 6 rules:

- Do not move teams into later rounds unless backend data confirms enough official information.
- Keep placeholders in later rounds until the backend/database provides the resolved match data.
- Leave eliminated teams only in the round where the backend provides them.
- Do not simulate bracket progression in the frontend.

Future backend fields that could support official progression:

- `qualifiedToMatchNumber`
- `qualifiedToSlot`
- `winnerGoesTo`
- `loserGoesTo`

If those fields are added later, the frontend can use them to place official qualifiers in future rounds.

## Idioma de UI

All visible UI text must be in Spanish.

Internal technical keys may remain in English for consistency, for example:

- `roundKey`
- `templateCode`
- `status`
- `homePlaceholder`
- `awayPlaceholder`
- `matchNumber`

Do not render technical keys in the UI, including:

- `round-of-32`
- `round-of-16`
- `pending-qualified-teams`
- `pending-previous-round-results`
- `templateCode`
- `roundKey`

Visible labels should use Spanish presentation fields such as:

- `Fase eliminatoria`
- `Datos oficiales`
- `Cuadro base`
- `Información oficial pendiente`
- `Equipos por definir`
- `Sin datos oficiales`
- `Resultado pendiente`
- `Pendiente de clasificación`
- `Pendiente del resultado anterior`

## Selector de ronda

The page includes an accessible round selector with a visible/associated label:

- `Filtrar por ronda`

Visible options:

- `Todas las rondas`
- `Dieciseisavos de final`
- `Octavos de final`
- `Cuartos de final`
- `Semifinales`
- `Partido por el tercer puesto`
- `Final`

Rules:

- Initial option may be `Todas las rondas`.
- Selecting a round renders only that round.
- Returning to `Todas las rondas` renders the complete bracket again.
- Selector labels must remain in Spanish.
- Internal option values may remain in English.

## Estados de UI

The page handles:

- loading state;
- delayed loading state with `FeedbackModal`;
- friendly API error state;
- backend-empty state using skeleton fallback;
- partial-data state combining backend matches and skeleton fallback;
- placeholder state for unresolved teams/results.

Technical backend errors must not be shown directly to users.

## Componentes implementados

Implemented page/components:

- `KnockoutStage` — page-level data loading, UI states, round filtering, and bracket composition.
- `KnockoutBracket` — renders the list of rounds.
- `KnockoutRound` — renders a round title and its matches.
- `KnockoutMatchCard` — renders match number, date, stadium, teams/placeholders, score, penalties, data-source badge, and optional official winner label.

## Archivos relacionados

Files created or modified for Block 6:

- `docs/task.md`
- `docs/knockout-stage.md`
- `src/routes/AppRoutes.jsx`
- `src/data/knockoutStageSkeleton.js`
- `src/utils/knockoutStageAdapter.js`
- `src/utils/knockoutStageAdapter.test.js`
- `src/components/KnockoutBracket/KnockoutBracket.jsx`
- `src/components/KnockoutBracket/KnockoutBracket.module.css`
- `src/components/KnockoutRound/KnockoutRound.jsx`
- `src/components/KnockoutRound/KnockoutRound.module.css`
- `src/components/KnockoutMatchCard/KnockoutMatchCard.jsx`
- `src/components/KnockoutMatchCard/KnockoutMatchCard.module.css`
- `src/pages/KnockoutStage/KnockoutStage.jsx`
- `src/pages/KnockoutStage/KnockoutStage.module.css`
- `src/pages/KnockoutStage/KnockoutStage.test.jsx`

Supporting source document:

- `docs/knockout-stage-skeleton.md`

## Tests

Tests added for Block 6:

- `src/utils/knockoutStageAdapter.test.js`
- `src/pages/KnockoutStage/KnockoutStage.test.jsx`

Coverage summary:

- skeleton fallback when backend data is empty;
- backend merge by `matchNumber`;
- backend merge by `templateCode`;
- normalized compound fallback matching;
- unsafe match rejection;
- partial backend data with skeleton fallback;
- regular scores from backend;
- penalties from backend;
- no winner derivation with incomplete data;
- no unsafe advancement of teams to future rounds;
- Spanish round labels, status labels, placeholders, and selector options;
- no visible technical keys such as `round-of-32`, `pending-qualified-teams`, `templateCode`, or `roundKey`;
- loading state;
- delayed-loading modal;
- friendly error state.

## Validaciones ejecutadas

Block 6 implementation validation:

- Preflight confirmed `which node` and `which pnpm` resolved first to Linux-native paths under `/home/yorch/.nvm/versions/node/v24.14.0/bin/...`.
- A Windows PNPM path appeared only as a secondary `type -a pnpm` result, which is acceptable under project rules.
- `pnpm run build`: passed.
- `pnpm run lint`: passed.
- `pnpm run test`: passed.

Vitest environment note:

- In this WSL environment, Vitest can fail before running tests if it tries to create temp files under `/mnt/c/Users/Usuario/AppData/Local/Temp/...`.
- Use Linux temp variables when needed:

```bash
export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp
pnpm run test
```

Final Block 6 validation result:

- 13 test files passed.
- 74 tests passed.

## Notas de backend futuro

Future backend improvements that would make knockout merge/progression more explicit:

- `matchNumber`
- `templateCode`
- `roundKey`
- `qualifiedToMatchNumber`
- `qualifiedToSlot`
- `winnerGoesTo`
- `loserGoesTo`

These fields would reduce reliance on normalized compound matching and allow official future-round placement when backend data confirms qualifiers.

## Backlog

Out of scope for Block 6:

- Prediction Fixture.
- Simulation of results.
- Frontend-only bracket progression.
- Refactor of match cards into a football-field/top-view layout.

The future football-field match-card visual refactor remains a backlog item and should only be implemented after explicit approval.
