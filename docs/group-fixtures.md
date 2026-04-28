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
