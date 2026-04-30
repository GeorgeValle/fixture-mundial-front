# Group Standings

## Page Agent Contract

This document is the source of truth for this page.

Any agent working on this page must read:

1. `project-requirements.md`
2. `task.md`
3. this page document
4. `docs/API-Backend-Mundial-2026.md` when backend data is involved

The page implementation must follow the task IDs assigned in `task.md`.

Behavior changes require tests.

## Objetivo

Mostrar cards o secciones por grupo con tablas compactas de posiciones para los grupos A-L.

## Public Read Endpoint

### `GET /api/standings`

This is the endpoint the public `/posiciones` page must use.

Confirmed behavior:

- Returns all groups A-L.
- Returns backend-calculated standings.
- The frontend must consume this calculated data as the source of truth.
- The frontend must not recalculate standings from matches while `GET /api/standings` is available.

Confirmed response wrapper:

```js
{
  status: 'success',
  data: [
    {
      group: 'A',
      teams: [
        {
          team: {
            _id: '...',
            name: 'México',
            shieldUrl: 'https://...',
            group: 'A',
            confederation: '...',
            position: null,
            qualifiedTo: null,
          },
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dif: 0,
          pts: 0,
        },
      ],
    },
  ],
}
```

### Response Shape

Top-level response:

- `status`: expected `success`.
- `data`: array of group standings.

Each item in `data`:

- `group`: group letter, for example `A`.
- `teams`: array with the standings rows for that group.

Each item in `teams`:

- `team`: team object.
- `pj`: partidos jugados.
- `pg`: partidos ganados.
- `pe`: partidos empatados.
- `pp`: partidos perdidos.
- `gf`: goles a favor.
- `gc`: goles en contra.
- `dif`: diferencia de gol.
- `pts`: puntos.

Each `team` object contains:

- `_id`
- `name`
- `shieldUrl`
- `group`
- `confederation`
- `position`
- `qualifiedTo`

`team.position` and `team.qualifiedTo` may be `null` initially. The UI must not invent qualification state when those fields are missing or null.

## Administrative / Maintenance Endpoint

### `POST /api/standings/:group`

Example:

- `POST /api/standings/G`

Confirmed behavior:

- Recalculates the standings for the requested group.
- Updates the standings in the backend database after match results have been loaded.
- Modifies backend state.

Confirmed response shape:

```js
{
  status: 'success',
  message: 'Grupo G actualizado en DB',
  data: [
    // Updated teams array for the requested group.
  ],
}
```

Response fields:

- `status`: operation status.
- `message`: confirmation message.
- `data`: updated `teams` array for the requested group.

## Bloque 5 Endpoint Rule

The public `/posiciones` page must call only:

- `GET /api/standings`

The public `/posiciones` page must not call:

- `POST /api/standings/:group`

Reason:

- `POST /api/standings/:group` modifies backend state.
- It is reserved for a future admin/maintenance flow unless the user explicitly approves using it elsewhere.

## UI Decision for Bloque 5

Recommended public UI:

- Render standings for all groups A-L.
- Use cards or sections per group.
- Each group should show a compact table.
- Show team shield and team name.
- Preserve backend-calculated order.
- Show qualification badges only when `team.position` or `team.qualifiedTo` contain useful data.
- If `team.position` or `team.qualifiedTo` are `null`, do not invent classification labels or badges.

Recommended columns:

- Pos
- Equipo
- PJ
- PG
- PE
- PP
- GF
- GC
- DIF
- PTS

## UI States

The `/posiciones` page must handle:

- Loading state.
- Delayed loading state using the shared delayed-loading feedback pattern.
- Empty state when there are no standings to show.
- Friendly error state for API failures.
- Invalid payload state when the response does not match the confirmed backend contract.

Technical backend errors must not be shown directly to users.

## Future Tests for Bloque 5

Expected tests when Bloque 5 implementation starts:

- Render of the `/posiciones` page.
- Loading state.
- Render of all groups A-L.
- Render of a group table.
- Render of team shields and names.
- Render of statistics: `pj`, `pg`, `pe`, `pp`, `gf`, `gc`, `dif`, `pts`.
- Empty state.
- API error state.
- Invalid payload state.
- Confirmation that the public page does not call `POST /api/standings/:group`.

## Acceptance

- The page shows standings for the 12 groups A-L.
- The table does not recalculate standings in the frontend when the backend returns calculated standings.
- The public page uses `GET /api/standings` only.
- The admin/maintenance `POST /api/standings/:group` endpoint remains out of the public UI.

## Implementation Notes

Bloque 5 implementation uses the confirmed public read endpoint only:

- `GET /api/standings`

Implemented behavior:

- `/posiciones` replaces the placeholder with a real Group Standings page.
- The page consumes backend-calculated standings through `getStandings()`.
- The frontend preserves the group and team order returned by the backend.
- The frontend does not recalculate standings from matches.
- The public UI does not call `POST /api/standings/:group`.
- Each group renders as a standings card with a semantic compact table.
- The table shows: Pos, Equipo, PJ, PG, PE, PP, GF, GC, DIF, PTS.
- When `team.position` is `null`, Pos uses the visual row index only.
- The UI does not invent classification badges when `team.qualifiedTo` is `null`.
- Missing `shieldUrl` values render a simple visual fallback without breaking the table.
- Loading, delayed loading, empty, friendly API error and invalid payload states are handled.

Relevant files:

- `src/services/standings/standingsService.js`
- `src/schemas/standingsSchema.js`
- `src/pages/GroupStandings/GroupStandings.jsx`
- `src/pages/GroupStandings/GroupStandings.module.css`
- `src/pages/GroupStandings/GroupStandings.test.jsx`
- `src/components/StandingsGroupCard/StandingsGroupCard.jsx`
- `src/components/StandingsGroupCard/StandingsGroupCard.module.css`
- `src/components/StandingsTable/StandingsTable.jsx`
- `src/components/StandingsTable/StandingsTable.module.css`
- `src/routes/AppRoutes.jsx`

## Visual Follow-up Notes

The standings cards were visually refined to better match the approved sports scoreboard light references.

Visual behavior:

- Each standings card uses a visible but elegant multicolor vertical accent on the left side.
- The card header is more prominent, with stronger hierarchy for the group label, title and team-count chip.
- The header includes a very subtle gray stadium/crowd-style watermark behind the title content.
- The watermark artwork uses four project-owned PNG variants stored in `src/assets/standingsHeaderWatermarks/`.
- The current PNG variants are `crowd-variant-1.png`, `crowd-variant-2.png`, `crowd-variant-3.png` and `crowd-variant-4.png`.
- The variants are assigned cyclically by group index so cards share the same visual language without looking identical.
- The PNG watermark layer must remain decorative only: low opacity, clipped by the header, and `pointer-events: none`.
- The page supports two viewing modes:
  - `Vista general`: renders all backend groups in a responsive grid, using compact standings cards.
  - `Vista foco`: renders one selected group at a time with the featured/protagonist card style.
- The `Vista foco` group selector is built from the groups returned by `GET /api/standings`.
- The view selector uses real `button` elements with `aria-pressed`; its grid/focus icons are CSS-only and do not require external icon dependencies.
- The `Equipo` column has stronger horizontal priority: shield/fallback sits to the left and team names align clearly to the left.
- The table remains clean, light, compact and legible.
- Qualification badges remain hidden when `team.position` or `team.qualifiedTo` are null.
- If future `qualifiedTo` values are shown, labels must be translated to Spanish instead of exposing raw backend values.
