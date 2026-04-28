# Knockout Stage

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
Mostrar el cuadro de eliminatorias desde partido 73 al 104.

## Fuente de datos
- Skeleton local inicial basado en eliminatorias.txt
- Datos oficiales backend cuando existan

## Modelo
- templateCode
- stage
- homePlaceholder
- awayPlaceholder
- stadium
- matchDate
- kickoffTime
- homeTeam
- awayTeam

## Reglas
- Si no hay clasificados, mostrar placeholders
- Si el backend devuelve equipos reales, reemplazar placeholders
- Si el partido terminó empatado en goles y hubo penales, mostrar score regular + score de penales

## Estado visual
- Vista puede mostrar badge “En construcción” mientras no haya cruces reales completos

## Aceptación
- El bracket se renderiza sin inventar equipos
- Las fechas visibles coinciden con eliminatorias.txt
