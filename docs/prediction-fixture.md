# Prediction Fixture

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
Permitir que el usuario cargue su nombre y pronostique resultados.

## Persistencia
- localStorage

## Campos
- userName
- predictions[]
  - matchId
  - predictedHomeScore
  - predictedAwayScore
  - locked
  - officialHomeScore
  - officialAwayScore

## Reglas de edición
- Si el partido no comenzó, editable
- Si el partido comenzó o terminó, no editable
- Si terminó, se rellena el resultado oficial del backend

## Scoring fase de grupos
- 1 punto por acertar ganador
- 2 puntos por acertar goles del ganador
- 1 punto por acertar goles del perdedor
- 1 punto por acertar empate
- 1 punto por acertar cantidad exacta de goles del empate

## Exportación
- Primera iteración: window.print()
- Iteración futura: PDF opcional

## Errores
- Predicción inválida: mensaje amigable
- localStorage corrupto: reset guiado y aviso al usuario

## Aceptación
- Guarda y recupera predicciones
- Recalcula scoring si cambian resultados oficiales
- No permite editar partidos ya jugados
