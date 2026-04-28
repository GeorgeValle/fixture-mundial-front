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
Mostrar cards pequeñas por grupo con tabla de posiciones.

## Fuente de datos
- GET /api/standings
- POST /api/standings/:group para recálculo administrativo

## Layout
- Navbar
- Grilla de cards
- Cada card contiene tabla de 4 equipos

## Columnas mínimas
- Posición
- Equipo
- PJ
- GF
- GC
- DG
- Pts
- Marca de clasificación

## Reglas
- Orden principal por backend
- Mostrar `position` y `qualifiedTo` si existen
- Badge `1`, `2`, `3` según clasificación al cierre

## Errores
- Si standings no cargan, mostrar modal amigable
- Si el grupo está incompleto, renderizar tabla igual con datos disponibles

## Aceptación
- Se ven los 12 grupos
- La tabla no recalcula en frontend si el backend ya la entrega ordenada
