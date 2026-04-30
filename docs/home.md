# Home

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
Mostrar los partidos del día o, si no existen, los del próximo día disponible.

## Fuente de datos
- GET /api/matches/schedule/daily?date=YYYY-MM-DD

## Layout
- Navbar arriba
- Card grande central con hasta 8 partidos
- Debajo: sección “de qué consiste el programa”
- Debajo: sección “cómo usarlo”

## Interacciones
- Si `today.length > 0`, renderizar `today`
- Si `today.length === 0`, renderizar `next`
- Si `next.length === 0`, mostrar estado vacío de calendario cerrado

## Estados
- loading: skeleton card
- delayed loading > 7s: FeedbackModal informativo
- error: FeedbackModal de error amigable

## Aceptación
- Nunca hace requests extra por equipos o estadio
- Siempre muestra navbar
- Si no hay partidos hoy, usa próximos
- No muestra errores técnicos

## Implementation Notes

Bloque 4 is complete and manually validated from the user's WSL terminal.

Implemented behavior:

- Home fetches the daily schedule with `GET /api/matches/schedule/daily?date=YYYY-MM-DD` using a dynamic date from `getTodayISODate()`.
- The daily schedule section appears immediately below the existing Home hero and before the informational cards.
- If `today` has matches, the page shows `Partidos de hoy`.
- If `today` is empty and `next` has matches, the page shows `Próxima fecha disponible` and uses a friendly formatted `nextDate` when available.
- Home must not render raw ISO `nextDate` values; schedule calendar dates are formatted as Spanish/Argentina-friendly labels such as `jueves, 11 de junio de 2026`.
- If `nextDate` is missing or invalid, Home keeps the friendly fallback copy and does not render `Invalid Date`, `null`, `undefined`, or the raw invalid value.
- If both `today` and `next` are empty, the page shows a friendly empty state.
- Daily matches reuse `FixtureMatchCard`.
- Loading reuses `SkeletonList`.
- Delayed loading reuses the shared delayed-loading threshold and `FeedbackModal` flow.
- API failures and invalid payloads render friendly states and do not expose raw backend details.

Relevant files:

- `src/pages/Home/Home.jsx`
- `src/pages/Home/Home.module.css`
- `src/pages/Home/Home.test.jsx`
- `src/components/DailyScheduleCard/DailyScheduleCard.jsx`
- `src/components/DailyScheduleCard/DailyScheduleCard.module.css`
- `src/services/matches/matchesService.js`
- `src/schemas/matchSchema.js`
- `src/utils/dateAdapter.js`

## Follow-up Completed

`nextDate` is formatted visually before rendering it in the UI.

Behavior:

- The backend may return a date-only value such as `2026-06-11` or a full ISO value such as `2026-06-11T00:00:00.000Z`.
- Home must display a friendly Spanish/Argentina date label instead of the raw backend value.
- Formatting must avoid timezone shifting; `2026-06-11T00:00:00.000Z` must stay on June 11 in the UI.
- Missing or invalid `nextDate` values must fall back to the friendly “Próxima fecha disponible” copy without exposing invalid values.
- Prefer a Spanish/Argentina-friendly date format.
- Acceptable examples:
  - `jueves, 11 de junio de 2026`
  - `jue, 11 jun 2026`

Implementation constraints:

- Do not change backend contracts.
- Add or update tests because this changes rendered behavior.
- Do not start Bloque 5 as part of this follow-up.
