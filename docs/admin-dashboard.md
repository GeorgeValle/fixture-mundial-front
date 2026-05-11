# Admin Zone Planning

## Propósito

Planificar el Admin Zone de `fixture-mundial-front` para operar resultados, standings, transición a eliminatorias y correcciones manuales sin duplicar lógica del backend.

El frontend admin debe ser una consola operativa. Los motores del backend siguen siendo la fuente de verdad para:

- standings;
- clasificación desde grupos;
- progresión de eliminatorias;
- actualización de `qualifiedTo`.

## Alcance de este documento

Incluye planificación de rutas, pantallas, servicios, componentes y reglas de interacción para futuros bloques de implementación.

No incluye implementación en `src/`, credenciales reales, secrets ni documentación de passwords.

## Fuentes revisadas

Documentos disponibles revisados:

- `docs/task.md`
- `docs/api-contract.md`
- `docs/group-fixtures.md`
- `docs/group-standings.md`
- `docs/knockout-stage.md`
- `docs/prediction-fixture.md`
- `docs/project-requirements.md`
- `docs/API-Backend-Mundial-2026.md`
- `docs/api-back.md`
- `docs/Backed_Standings_Engine.md`
- `docs/Backend_Bracket_Engine.md`
- `docs/Backend_Transition_Engine.md`

Los documentos bajo `docs/worldcup2026/` no están presentes en el workspace actual.

## Reglas generales

- Ruta de entrada: `/admin`.
- Si el admin no está autenticado, `/admin` redirige a `/admin/login`.
- Si el admin está autenticado, `/admin` redirige a `/admin/dashboard`.
- Las secciones internas del Admin Zone deben ser rutas hijas protegidas.
- La UI visible puede estar en español.
- Nombres técnicos, componentes, servicios, constantes y rutas internas deben mantenerse en inglés.
- No agregar `Admin Stadiums` por ahora.
- `Stadiums` solo se consumiría como catálogo si una pantalla futura necesita cambiar sede.
- No documentar credenciales reales.
- Las llamadas privadas deben usar cookie `HttpOnly` y `withCredentials`.

## Contratos backend y confirmaciones pendientes para Admin Zone

Usar solo endpoints confirmados al implementar servicios. Los endpoints marcados como pendientes deben validarse contra el backend antes de escribir código.

| Acción | Endpoint | Estado |
| --- | --- | --- |
| Login | `POST /api/auth/login` | Confirmado por Bloque 12 |
| Logout | `POST /api/auth/logout` | Confirmado por Bloque 12 |
| Restaurar sesión recomendada | `GET /api/auth/me` | Confirmado por Bloque 12 cuando el backend está disponible |
| Listar partidos | `GET /api/matches` | Confirmado por Bloque 13 |
| Actualizar partido | `PUT /api/matches/:id` | Confirmado por Bloque 13 |
| Leer standings | `GET /api/standings` | Confirmado para UI pública y revisión admin |
| Recalcular standings de grupo | `POST /api/standings/:group` o `POST /api/admin/standings/:group` | Pendiente de confirmar antes del Bloque 14 |
| Clasificar grupo a eliminatorias | `POST /api/admin/classify-group` | Documentado para Bloque 15; confirmar antes de implementar |
| Corrección manual de equipo | `PUT /api/teams/:id` | Documentado para Bloque 16; confirmar antes de implementar |

> Nota: algunos documentos legacy usan variantes con prefijo `/api/admin` para matches, teams o standings. Para el Bloque 14 no se debe inventar endpoint: primero confirmar la ruta real de recálculo de standings y sus efectos.

## Valores canónicos

### Match status

```txt
PENDING
PLAYING
FINISHED
```

`IN_PROGRESS` es legacy y debe reemplazarse por `PLAYING`.

### Team `qualifiedTo`

```txt
ROUND_OF_32
ROUND_OF_16
QUARTER_FINALS
SEMI_FINALS
THIRD_PLACE_MATCH
FINAL
ELIMINATED
null
```

Valores legacy a normalizar:

- `16AVOS` -> `ROUND_OF_32`
- `OCTAVOS` -> `ROUND_OF_16`
- `CUARTOS` -> `QUARTER_FINALS`
- `SEMIFINAL` -> `SEMI_FINALS`
- `3RO` -> `THIRD_PLACE_MATCH`
- `ELIMINADO` -> `ELIMINATED`

### Shield field

El campo real para escudo/bandera es `shieldUrl`.

`flagUrl` es legacy y debe reemplazarse por `shieldUrl`.

## Rutas frontend propuestas

| Ruta | Propósito |
| --- | --- |
| `/admin` | Entrada con redirect según auth |
| `/admin/login` | Login administrativo |
| `/admin/dashboard` | Resumen operativo |
| `/admin/matches` | Carga de resultados de partidos |
| `/admin/groups` | Recálculo y revisión de standings |
| `/admin/transition` | Siembra de grupos a eliminatorias |
| `/admin/teams-corrections` | Correcciones excepcionales de equipos |
| `/admin/knockouts` | Monitor y carga de resultados de eliminatorias |

## Sectores

### 1. Admin Dashboard

Debe resumir:

- partidos pendientes;
- partidos en juego;
- partidos finalizados;
- grupos con 6/6 partidos finalizados;
- grupos pendientes de recálculo;
- grupos listos para transición;
- slots de eliminatorias pendientes;
- accesos rápidos a matches, groups, transition, corrections y knockouts.

Los indicadores del dashboard son señales operativas, no cálculo oficial de standings ni bracket.

### 2. Admin Matches

Debe permitir:

- filtrar por grupo, fase y status;
- cambiar status `PENDING`, `PLAYING` o `FINISHED`;
- cargar `homeScore` y `awayScore`;
- cargar `homePenaltyScore` y `awayPenaltyScore` solo cuando aplique;
- guardar payload parcial con `PUT /api/matches/:id`;
- refrescar `GET /api/matches` después de guardar.

Reglas:

- no enviar strings vacíos;
- convertir scores a `Number`;
- no enviar penales si no aplican;
- no mover equipos manualmente en brackets;
- si el partido es eliminatoria y se finaliza, confiar en el Bracket Engine.

### 3. Admin Groups

Debe permitir:

- seleccionar grupo A-L;
- ver resumen de partidos finalizados del grupo;
- ver standings actuales;
- disparar el endpoint backend confirmado de recálculo de standings, si existe;
- mostrar feedback de éxito/error;
- refrescar `GET /api/standings` después de recalcular.

Regla clave: React no recalcula standings.

### 4. Admin Transition

Debe permitir:

- seleccionar grupo;
- revisar equipos con `qualifiedTo: "ROUND_OF_32"`;
- ejecutar `POST /api/admin/classify-group` con `{ "group": "A" }`;
- refrescar `GET /api/matches`;
- mostrar bracket/slots actualizados.

Reglas:

- no calcular combinaciones de terceros desde React;
- no sembrar equipos manualmente desde React;
- no modificar placeholders.

### 5. Admin Teams Corrections

Uso excepcional, no gestión completa de equipos.

Debe permitir corregir:

- `position`;
- `qualifiedTo`;
- `shieldUrl`.

Casos de uso:

- empate absoluto;
- Fair Play;
- sorteo;
- mejores terceros;
- corrección manual previa a transition.

No editar normalmente:

- `name`;
- `group`;
- `confederation`.

Debe usar confirmaciones fuertes antes de guardar.

### 6. Admin Knockouts

Debe funcionar como monitor + carga de resultados, no como editor libre del bracket.

Debe mostrar:

- `matchNumber`;
- `placeholderHome` / `placeholderAway`;
- `homeTeam` / `awayTeam`;
- `nextMatchWinner`;
- `nextMatchLoser`;
- `status`;
- scores;
- penalties.

Debe permitir:

- cargar resultado;
- cargar penales si aplica;
- marcar `FINISHED`;
- refrescar bracket.

No debe permitir:

- editar `nextMatchWinner`;
- editar `nextMatchLoser`;
- editar placeholders;
- arrastrar equipos manualmente;
- mover ganadores desde React.

## Bloque 14 — Admin Groups & Standings Controls

Estado: implementado como vista protegida de revisión operativa en `/admin/groups`. El recálculo quedó deshabilitado porque el contrato backend sigue ambiguo.

### Intención funcional

El módulo `Admin Groups & Standings Controls` debe darle al admin una vista operativa de grupos y standings sin mover la lógica deportiva al frontend.

Responsabilidades implementadas:

- visualizar grupos A-L y permitir seleccionar un grupo;
- revisar cuántos partidos del grupo están finalizados;
- revisar standings actuales consumidos desde `GET /api/standings`;
- mostrar avisos de grupo pendiente, incompleto, listo para revisar o listo para acción backend;
- mostrar la acción de recálculo deshabilitada con el mensaje `Endpoint de recálculo pendiente de confirmación`;
- no disparar POST de recálculo hasta resolver el contrato backend;
- mostrar errores amigables cuando la cookie admin falte, expire o el backend rechace la acción;
- mantener `withCredentials` explícito en cualquier servicio admin porque `axiosClient` no lo centraliza.

### Responsabilidades sobre datos derivados

Standings, posiciones, diferencias de gol, puntos, clasificados y `qualifiedTo` son datos derivados o gestionados por motores backend.

El frontend admin puede:

- mostrar esos datos;
- advertir cuando los datos puedan estar desactualizados después de editar resultados;
- dejar preparada la revisión previa a una acción backend futura, sin ejecutarla mientras el endpoint esté ambiguo;
- guiar al admin hacia el siguiente flujo aprobado.

El frontend admin no debe:

- recalcular standings desde partidos;
- editar puntos, goles a favor, goles en contra o diferencia de gol manualmente;
- calcular mejores terceros;
- asignar `qualifiedTo` por su cuenta;
- sembrar eliminatorias desde `/admin/groups`;
- usar endpoints no confirmados para corregir inconsistencias.

Como la documentación disponible mantiene el conflicto entre `POST /api/standings/:group` y `POST /api/admin/standings/:group`, el Bloque 14 no ejecuta recálculo. La pantalla carga partidos y standings, calcula solo conteos operativos por status y muestra standings oficiales recibidos del backend.

### Preguntas abiertas para backend

- ¿La ruta real para recalcular standings es `POST /api/standings/:group` o `POST /api/admin/standings/:group`?
- ¿El endpoint de recálculo requiere body o solo el `group` en la URL?
- ¿Qué grupos son válidos y cómo responde el backend ante un grupo inválido?
- ¿`PUT /api/matches/:id` recalcula standings automáticamente cuando cambia un resultado?
- Si el recálculo no es automático, ¿hay endpoint admin para recalcular un grupo o todos los grupos?
- ¿El recálculo actualiza `qualifiedTo` o eso queda reservado para `POST /api/admin/classify-group`?
- ¿`qualifiedTo` puede editarse manualmente, o solo mediante correcciones excepcionales del Bloque 16?
- ¿Qué permisos exactos requiere cada acción y cómo se reportan errores de cookie ausente, expirada o inválida?
- ¿La respuesta de recálculo devuelve standings actualizados o solo un mensaje de éxito?
- ¿Existe un indicador backend de standings stale/pending, o la UI solo puede inferirlo por partidos finalizados?

### Validaciones manuales futuras

Después de la implementación del Bloque 14, validar manualmente:

- acceso protegido a `/admin/groups` solo con sesión admin vigente;
- redirect a `/admin/login` cuando la cookie no esté disponible;
- llamadas admin con `withCredentials` y sin tokens en `localStorage` o `sessionStorage`;
- carga de grupos y standings actuales;
- estados de loading, empty, error y retry;
- mensajes claros para grupos con partidos pendientes;
- acción de recálculo deshabilitada mientras el endpoint no esté confirmado;
- refresco de datos con el botón `Reintentar` ante errores;
- reflejo de standings oficiales recibidos por `GET /api/standings`, igual que `/posiciones`;
- comportamiento seguro ante errores 401/403/404/409/500;
- ausencia de cálculos de standings o clasificación en React.

### Riesgos técnicos

- olvidar `withCredentials` en servicios admin y romper la cookie `HttpOnly`;
- usar una ruta legacy de standings y documentar como existente un endpoint incorrecto;
- duplicar en React reglas del Standings Engine;
- mostrar standings desactualizados después de editar resultados en `/admin/matches`;
- mezclar recálculo de standings con transición a eliminatorias;
- tratar `qualifiedTo` como editable cuando el backend lo deriva;
- alterar datos derivados y producir inconsistencias con `/posiciones`, `/eliminatorias` o `/predicciones`;
- no distinguir entre grupo incompleto, grupo listo para recálculo y grupo listo para transición;
- asumir reglas de mejores terceros sin contrato backend.

### Fuera de alcance del Bloque 14

- implementar `POST /api/admin/classify-group` o sembrar eliminatorias;
- modificar `qualifiedTo` manualmente;
- editar datos base de equipos;
- gestionar mejores terceros;
- corregir bracket o placeholders;
- rediseñar páginas públicas;
- crear lógica local de standings;
- agregar persistencia nueva para predicciones;
- activar recálculo hasta resolver el contrato backend.

## Componentes propuestos

- `AdminLayout`
- `AdminSidebar`
- `AdminTopbar`
- `AdminProtectedRoute`
- `AdminDashboardPage`
- `AdminLoginPage`
- `AdminMatchesPage`
- `AdminGroupsPage`
- `AdminTransitionPage`
- `AdminTeamCorrectionsPage`
- `AdminKnockoutsPage`
- `AdminMatchResultForm`
- `AdminScoreInputs`
- `AdminPenaltyInputs`
- `AdminGroupRecalculateCard`
- `AdminClassifyGroupCard`
- `AdminTeamCorrectionForm`
- `AdminConfirmDialog`
- `AdminStatusBadge`
- `AdminActionToast`

Cada componente debe vivir en su propia carpeta y usar CSS Modules.

## Servicios propuestos

- `src/services/admin/adminAuthService.js`
- `src/services/admin/adminMatchesService.js`
- `src/services/admin/adminStandingsService.js`
- `src/services/admin/adminTransitionService.js`
- `src/services/admin/adminTeamsService.js`

Reglas:

- usar `axiosClient`;
- usar `withCredentials` para auth/admin;
- normalizar errores;
- no repetir endpoints en componentes;
- no exponer tokens al JavaScript.

## Constantes propuestas

- `src/constants/adminRoutes.js`
- `src/constants/matchStatus.js`
- `src/constants/qualifiedTo.js`

Estas constantes deben mantener valores técnicos en inglés y labels visibles en español.

## Payload rules

Para rutas admin:

- enviar payload parcial;
- omitir campos no modificados;
- omitir strings vacíos;
- convertir inputs numéricos a `Number`;
- no enviar status traducidos;
- no enviar penales si el partido no los requiere;
- no enviar objetos completos de Axios, cookies, headers ni datos sensibles a localStorage.

## Relación con la app pública

- `/posiciones` sigue leyendo `GET /api/standings`.
- `/eliminatorias` sigue leyendo `GET /api/matches`.
- `/predicciones` sigue bloqueando y puntuando según `status`, `date` y resultados oficiales.
- El Admin Zone actualiza datos oficiales; la app pública solo los renderiza al refrescar.
- Las predicciones de eliminatorias públicas solo deben habilitarse cuando existan `homeTeam` y `awayTeam` reales.

## Fuera de alcance por ahora

- `Admin Stadiums`.
- Gestión completa de equipos.
- Cálculo frontend de standings.
- Cálculo frontend de mejores terceros.
- Cálculo frontend de progresión de bracket.
- Edición manual de puntos, posiciones o diferencias de gol si el backend recalcula standings.
- Editor drag-and-drop de eliminatorias.
- Persistencia backend de predicciones.

## Criterios de aceptación futuros

- `/admin` redirige correctamente según sesión.
- Las rutas hijas admin están protegidas.
- Login/logout no exponen tokens al frontend.
- Matches guardan resultados con payloads parciales limpios.
- `/admin/groups` revisa standings oficiales y mantiene recálculo deshabilitado hasta confirmar endpoint.
- Transition llama al Transition Engine.
- Finalizar eliminatoria confía en el Bracket Engine y refresca matches.
- Correcciones de equipos están limitadas y confirmadas.
- La app pública refleja datos actualizados sin duplicar engines.
