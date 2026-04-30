# Group Fixtures

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
Mostrar los 6 partidos de un grupo dentro de una card principal.

## Fuente de datos
- GET /api/matches
- Filtrado por `stage = GRUPO X`

## Layout
- Navbar
- Card grande
- Selector de grupo A-L
- Lista de 6 filas de partido

## Datos renderizados
- Equipo local
- Escudo local
- Equipo visitante
- Escudo visitante
- Estadio
- Fecha y hora local
- Marcador
- Estado del partido

## Reglas
- Si el partido está `PENDING`, el marcador se muestra vacío
- Si el partido está `PLAYING` o `FINISHED`, mostrar scores
- Si hay penales y corresponde mostrarlo, usar un badge secundario

## Aceptación
- Cambiar grupo actualiza la card
- Cada grupo renderiza 6 partidos
- No se alojan banderas en el repo

## Implementation Notes

Bloque 3 is complete and manually validated from the user's WSL terminal.

Implemented behavior:

- `/grupos` fetches the full fixture with `GET /api/matches` through `axiosClient`.
- The page filters matches by `stage = "GRUPO X"` for groups A-L.
- The default selected group is A.
- Each selected group renders its group-stage matches ordered by date.
- Pending matches show a friendly score placeholder instead of `null`.
- API failures and invalid payloads render friendly error states.
- Delayed loading uses the shared delayed-loading modal flow.

Relevant files:

- `src/pages/GroupFixtures/GroupFixtures.jsx`
- `src/pages/GroupFixtures/GroupFixtures.module.css`
- `src/pages/GroupFixtures/GroupFixtures.test.jsx`
- `src/components/GroupSelector/GroupSelector.jsx`
- `src/components/GroupSelector/GroupSelector.module.css`
- `src/components/FixtureMatchCard/FixtureMatchCard.jsx`
- `src/components/FixtureMatchCard/FixtureMatchCard.module.css`
- `src/constants/groups.js`
- `src/services/matches/matchesService.js`
- `src/schemas/matchSchema.js`

Validation notes:

- The backend wrapper `{ status: "success", data: [...] }` is accepted by `parseMatchesResponse`.
- The group selector layering fix keeps the select clickable over decorative page elements.
- Stderr logs in error-path tests are expected when tests intentionally validate API or invalid-payload handling.
