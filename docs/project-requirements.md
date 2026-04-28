# Project Requirements

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
Construir el frontend del proyecto `fixture-mundial-front` para visualizar el fixture oficial, standings, eliminatorias y predicciones personales del Mundial 2026.

## Technical Stack

- React + Vite.
- JavaScript only.
- CSS Modules by component.
- Redux Toolkit for global state.
- Axios for backend requests.
- React Hook Form + Zod for validation.
- Vitest + React Testing Library + MSW for tests.
- pnpm only.
- No TypeScript migration.
- No Tailwind.
- No Bootstrap.
- No UI frameworks.


## Navegación principal aprobada

- Inicio → `/`
- Fixture → `/grupos`
- Tablas → `/posiciones`
- Eliminatorias → `/eliminatorias`
- Predicciones → `/predicciones`

## Páginas futuras/opcionales

Estas rutas quedan fuera del Navbar principal por ahora:

- Partidos → `/partidos`
- Equipos → `/equipos`
- Estadios → `/estadios`

## Backend Base URL

The frontend must consume the backend API from:

`https://world-cup-2026-back.onrender.com`

Backend documentation lives in:

`docs/API-Backend-Mundial-2026.md`

## Data Rules

Official data comes from the backend.

User predictions are stored in localStorage.

Flags and shields are loaded from Cloudinary URLs. Do not commit image assets for flags or team shields to the repository.

## Loading and Feedback Rules

The backend may be slow to wake up because it is hosted on a free Render instance.

All backend-powered cards must show skeleton loaders while loading.

If loading takes more than 7 seconds, show a friendly modal asking the user to wait a few more seconds.

Technical errors must never be shown directly to users.

## Testing Requirement

Every behavior-changing task must include or update tests.

Minimum testing stack:

- Vitest
- React Testing Library
- MSW

Required test areas:

- scoring algorithm
- prediction locking
- Axios error normalization
- daily schedule rendering
- form validation
- localStorage persistence
- skeleton loading behavior
- standings rendering
- knockout placeholders

## Agent Workflow Requirement

Implementation must follow the orchestrator-based workflow defined in `AGENTS.md`.

The Orchestrator Agent must use Engram MCP to retrieve and persist durable project decisions.

## Restricciones
- No usar Tailwind, Bootstrap ni frameworks CSS.
- Cada componente vive en su propia carpeta con `Component.jsx` y `Component.module.css`.
- La carpeta `.codex` la crea el usuario manualmente.
- El frontend debe consumir el backend desplegado en `https://world-cup-2026-back.onrender.com`.

## Datos de dominio
### Team
- _id
- name
- shieldUrl
- group
- confederation
- position
- qualifiedTo

### Match
- _id
- homeTeam
- awayTeam
- stadium
- date
- stage
- status
- homeScore
- awayScore
- homePenaltyScore
- awayPenaltyScore

### Stadium
- _id
- name
- country
- city
- address
- capacity

## Endpoints base
- GET /api/teams
- GET /api/stadiums
- GET /api/matches
- GET /api/matches/schedule/daily?date=YYYY-MM-DD
- PUT /api/matches/:id
- GET /api/standings
- POST /api/standings/:group

## Reglas de UX
- Navbar visible en todas las vistas.
- Mientras cargan datos, mostrar skeleton loaders con forma de card.
- Si la carga supera 7 segundos, mostrar FeedbackModal informando que el backend está demorando.
- El usuario nunca debe ver mensajes técnicos de error.
- Los partidos ya jugados no pueden editarse en Prediction Fixture.
- Cuando un partido termina, la predicción se congela y se rellena con el resultado oficial del backend.

## Scoring de predicciones en fase de grupos
- 1 punto por acertar quién gana.
- 2 puntos por acertar los goles del equipo ganador.
- 1 punto por acertar los goles del equipo perdedor.
- 1 punto por acertar empate.
- 1 punto por acertar por cuántos goles empataron.
- El scoring se recalcula si cambia el resultado oficial del backend.

## Fases
- Fase 1: base técnica, routing, store, API client, modal, loaders, tests.
- Fase 2: Home y Group Fixtures.
- Fase 3: Group Standings y actualización post-resultados.
- Fase 4: Knockout Stage con placeholders.
- Fase 5: Prediction Fixture, scoring y print.
- Fase 6: hardening, cobertura, documentación final.
