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
