# Admin Knockouts Controls & Public Knockout Polish

## Objetivo

Planificar el Bloque 17 para crear una consola admin específica de eliminatorias en `/admin/knockouts`, permitiendo cargar resultados oficiales sin duplicar la lógica del Bracket Engine en React.

El frontend admin debe funcionar como consola operativa: muestra datos, permite enviar resultados confirmados y refresca la información. La progresión de ganadores, perdedores y próximos cruces sigue siendo responsabilidad del backend.

## Alcance incluido

- Crear una ruta protegida recomendada: `/admin/knockouts`.
- Habilitar `Eliminatorias` en el sidebar admin durante un futuro Build Mode aprobado.
- Cargar partidos desde `GET /api/matches` usando sesión admin con `withCredentials: true`.
- Filtrar eliminatorias de forma conservadora por `matchNumber >= 73` y/o stages knockout canónicos.
- Mostrar datos operativos de cada eliminatoria:
  - `matchNumber`;
  - fase;
  - equipos reales cuando existan;
  - placeholders cuando todavía falten equipos;
  - `nextMatchWinner`;
  - `nextMatchLoser`;
  - status;
  - scores;
  - penales.
- Permitir guardar resultados con `PUT /api/matches/:id` y `withCredentials: true`.
- Permitir cargar `homePenaltyScore` y `awayPenaltyScore` cuando una eliminatoria finalizada queda empatada en `homeScore` y `awayScore`.
- Refrescar con `GET /api/matches` después de guardar para reflejar la progresión real del Bracket Engine.
- Confirmar que `/eliminatorias` pública renderiza los datos actualizados sin exponer controles admin.

## Fuera de alcance

- No editar `homeTeam` ni `awayTeam` desde React.
- No editar `placeholderHome` ni `placeholderAway` desde React.
- No editar `nextMatchWinner` ni `nextMatchLoser` desde React.
- No calcular ganadores, perdedores ni próximos cruces en React.
- No implementar drag-and-drop ni edición manual del bracket.
- No crear endpoints nuevos.
- No modificar contratos backend.
- No habilitar predicciones knockout en este bloque.

## Contratos backend confirmados

| Acción | Endpoint | Uso esperado |
| --- | --- | --- |
| Leer partidos | `GET /api/matches` | Cargar fixture completo y filtrar eliminatorias en frontend. |
| Actualizar partido | `PUT /api/matches/:id` | Guardar status, scores y penales con payload parcial. |

Reglas de uso frontend:

- Las llamadas admin deben enviar `withCredentials: true`.
- El payload de actualización debe ser parcial y limpio.
- Para una eliminatoria empatada y `FINISHED`, el frontend debe exigir `homePenaltyScore` y `awayPenaltyScore`.
- Después de guardar, la pantalla debe recargar `GET /api/matches` para mostrar lo que el backend dejó persistido.

## Ruta recomendada

```text
/admin/knockouts
```

La ruta debe estar protegida por `AdminProtectedRoute` y renderizarse dentro de `AdminLayout`.

## Datos a mostrar

Cada card o fila de eliminatoria debe mostrar, cuando el backend lo provea:

- `matchNumber`;
- fase/stage con label visible en español;
- `homeTeam` y `awayTeam` reales si existen;
- placeholders si los equipos aún no están definidos;
- `nextMatchWinner`;
- `nextMatchLoser`;
- status (`PENDING`, `PLAYING`, `FINISHED`);
- `homeScore` y `awayScore`;
- `homePenaltyScore` y `awayPenaltyScore` cuando correspondan.

## Regla de seguridad

React no debe editar equipos, placeholders, `nextMatchWinner`, `nextMatchLoser` ni calcular ganadores.

El Bracket Engine del backend es la fuente de verdad para:

- determinar ganador por goles o penales;
- avanzar el ganador al match indicado por `nextMatchWinner`;
- enviar perdedores al match indicado por `nextMatchLoser` cuando aplique;
- persistir la progresión real del bracket.

## Flujo sugerido

1. Admin entra a `/admin/knockouts` con sesión vigente.
2. La pantalla carga partidos con `GET /api/matches` y `withCredentials: true`.
3. La UI filtra eliminatorias y muestra datos operativos.
4. Admin edita status, goles y penales cuando correspondan.
5. Antes de guardar una eliminatoria como `FINISHED`, la UI pide confirmación.
6. La pantalla envía `PUT /api/matches/:id` con payload parcial.
7. Si el backend responde success, la pantalla refresca con `GET /api/matches`.
8. La UI muestra el estado actualizado que devuelve el backend.

## Riesgos a confirmar

Antes de implementar o validar contra backend real, confirmar:

- si re-guardar una eliminatoria ya `FINISHED` es idempotente;
- qué ocurre si se corrige un resultado ya propagado a la siguiente ronda;
- si el backend limpia o recalcula slots posteriores cuando cambia un ganador anterior;
- formato exacto de errores cuando falta definición por penales;
- si `nextMatchWinner` y `nextMatchLoser` siempre son `matchNumber` numéricos;
- stages canónicos esperados para eliminatorias: `ROUND_OF_32`, `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE_MATCH`, `FINAL`.

## Validaciones automáticas sugeridas para futuro Build Mode

- Test de ruta protegida para `/admin/knockouts`.
- Test de sidebar para verificar que `Eliminatorias` navega a `/admin/knockouts` cuando esté habilitado.
- Test de servicio para confirmar `GET /api/matches` y `PUT /api/matches/:id` con `withCredentials: true`.
- Test de filtrado para mostrar solo eliminatorias.
- Test de payload parcial sin `homeTeam`, `awayTeam`, placeholders, `nextMatchWinner` ni `nextMatchLoser`.
- Test de validación de penales para empates knockout finalizados.
- Test de refresh posterior a un guardado exitoso.
- Test público para confirmar que `/eliminatorias` no expone controles admin.

En QA Mode futuro, después del preflight WSL válido:

```bash
pnpm run lint
TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test
pnpm run build
```

## Validaciones manuales sugeridas

- Entrar a `/admin/knockouts` sin sesión y confirmar redirect a `/admin/login`.
- Entrar con sesión admin y confirmar carga de eliminatorias.
- Confirmar que los placeholders se muestran como equipos por definir, no como equipos reales.
- Finalizar una eliminatoria con ganador por goles y verificar refresh.
- Intentar finalizar una eliminatoria empatada sin penales y confirmar bloqueo/error amigable.
- Finalizar una eliminatoria empatada con penales válidos y verificar refresh.
- Revisar que `/eliminatorias` pública refleja datos actualizados sin botones admin.
- Revisar que no se muestran errores técnicos crudos del backend.

## Límite de predicciones knockout

Las predicciones knockout quedan fuera de alcance del Bloque 17.

No deben habilitarse en este bloque salvo una validación futura explícita con cruces reales (`homeTeam` y `awayTeam`) y una planificación separada para campos visibles de penales, locking y scoring.

## Estado final del Bloque 17

Implementado y validado automáticamente.

### Decisiones finales

- `/admin/knockouts` quedó como ruta admin protegida dedicada dentro de `AdminLayout`.
- `Eliminatorias` quedó habilitado en el sidebar admin.
- La pantalla reutiliza `getAdminMatches` y `updateAdminMatch`, que usan `GET /api/matches` y `PUT /api/matches/:id` con `withCredentials: true`.
- React solo envía `status`, `homeScore`, `awayScore`, `homePenaltyScore` y `awayPenaltyScore` cuando corresponden.
- React no calcula ganadores ni modifica `homeTeam`, `awayTeam`, placeholders, `matchNumber`, `nextMatchWinner` ni `nextMatchLoser`.
- Después de guardar, la pantalla refresca `GET /api/matches` para reflejar la progresión persistida por el Bracket Engine.
- Las predicciones knockout siguen fuera de alcance del bloque.

### Archivos creados o modificados

- `src/pages/AdminKnockoutsPage/AdminKnockoutsPage.jsx`
- `src/pages/AdminKnockoutsPage/AdminKnockoutsPage.module.css`
- `src/pages/AdminKnockoutsPage/AdminKnockoutsPage.test.jsx`
- `src/routes/AppRoutes.jsx`
- `src/routes/AdminRoutes.test.jsx`
- `src/constants/adminRoutes.js`
- `src/pages/AdminDashboardPage/AdminDashboardPage.jsx`
- `src/pages/KnockoutStage/KnockoutStage.test.jsx`
- `src/pages/PredictionFixture/PredictionFixture.test.jsx`
- `docs/task.md`
- `docs/admin-knockouts.md`

### Validaciones automáticas ejecutadas

- `pnpm run lint`: aprobado.
- `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`: aprobado, 36 archivos de test y 361 tests.
- `pnpm run build`: aprobado con advertencia informativa de Vite por chunk mayor a 500 kB.

### Pendiente de validación manual/backend real

- Confirmar idempotencia al re-guardar una eliminatoria ya `FINISHED`.
- Confirmar comportamiento del backend al corregir resultados ya propagados a rondas posteriores.

