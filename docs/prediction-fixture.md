# Prediction Fixture

## Page Agent Contract

This document is the source of truth for the `/predicciones` page.

Any agent working on this page must read:

1. `docs/project-requirements.md`
2. `docs/task.md`
3. this page document
4. `docs/API-Backend-Mundial-2026.md` when backend data is involved
5. `DESIGN.md` before visual, layout, or shared UI changes

The page implementation must follow the task IDs assigned in `docs/task.md`.

Behavior changes require tests.

## Objetivo

Permitir que el usuario cargue su nombre y pronostique resultados del Mundial 2026.

Prediction Fixture debe usar el backend solo como fuente de partidos, estados y resultados oficiales. Las predicciones del usuario se guardan localmente.

## Fuente de datos

- Backend: `GET /api/matches` para listar partidos, leer `status`, `date`, equipos y resultados oficiales.
- Backend opcional: `GET /api/matches/:id` para refrescar detalle puntual si una interacción lo requiere.
- Persistencia de usuario: `localStorage`.

## Persistencia local

Las predicciones se guardan en `localStorage`.

Modelo base esperado:

- `userName`
- `predictions[]`
  - `matchId`
  - `predictedHomeScore`
  - `predictedAwayScore`
  - `predictedHomePenaltyScore`
  - `predictedAwayPenaltyScore`
  - `locked`
  - `officialHomeScore`
  - `officialAwayScore`
  - `officialHomePenaltyScore`
  - `officialAwayPenaltyScore`
  - `points`
  - `indicators[]`

If localStorage is corrupt, the UI must offer a guided reset and avoid crashing.

## Reglas de edición y locking

- `PENDING`: editable only if current date/time is before `match.date`.
- `PLAYING`: locked.
- `FINISHED`: locked.
- If `now >= match.date`, lock the prediction even if `status` is still `PENDING`.

## Alcance de predicciones por etapa

### Fase de grupos

- First implementation should support prediction cards for group-stage matches.
- Group-stage predictions use regular score only.

### Eliminatorias

- Keep knockout predictions closed until real knockout matches exist in the backend.
- Do not allow predictions over skeleton-only knockout placeholders.
- If a real knockout match allows a regular-time tie prediction, the user must complete penalty fields.
- A knockout prediction with tied penalty scores is invalid.

## Resultado oficial

Official result comes from:

- `homeScore`
- `awayScore`
- `homePenaltyScore`
- `awayPenaltyScore`

Do not calculate scoring if official data is incomplete.

## Scoring fase de grupos

- 1 point for correct winner.
- 2 points for correct winner goals.
- 1 point for correct loser goals.
- 1 point for correct draw.
- 1 point for exact draw goals.
- Recalculate scoring if backend official results change.

## Scoring eliminatorias

### Regular-time winner

- 2 points for correct winner/qualifier.
- 1 point for correct winner goals.
- 1 point for correct loser goals.

### Regular draw decided by penalties

- 2 points for correct winner/qualifier.
- 1 point for predicting a regular-time draw.
- 1 point for exact draw goals.
- 1 point for correct winner penalty goals.
- 1 point for correct loser penalty goals.

## Indicadores visibles

Finished matches should show text indicators, not color-only feedback.

Expected indicators:

- `Ganador acertado`
- `Clasificado acertado`
- `Empate acertado`
- `Goles del ganador acertados`
- `Goles del perdedor acertados`
- `Goles del empate acertados`
- `Penales del ganador acertados`
- `Penales del perdedor acertados`

## Exportación

- Primera iteración: `window.print()`.
- Iteración futura: PDF opcional.

## Errores

- Predicción inválida: mensaje amigable.
- localStorage corrupto: reset guiado y aviso al usuario.
- Resultado oficial incompleto: no calcular scoring todavía.

## Aceptación

- Guarda y recupera predicciones.
- Recalcula scoring si cambian resultados oficiales.
- No permite editar partidos ya iniciados o terminados.
- No permite editar si `now >= match.date`.
- No permite predicciones de eliminatorias sobre placeholders.
- Muestra predicción, resultado oficial, puntos e indicadores cuando el partido finalizó.
- Permite imprimir con `window.print()`.
