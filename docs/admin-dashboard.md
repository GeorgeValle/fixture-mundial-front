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
| Recalcular standings de grupo | `POST /api/standings/:group` o `POST /api/admin/standings/:group` | Pendiente de confirmar antes de habilitar una mutación |
| Clasificar grupo a eliminatorias | `POST /api/admin/classify-group` | Confirmado en follow-up del Bloque 15 con body `{ group }`; frontend solo envía el grupo y backend calcula/injecta clasificados |
| Corrección manual de equipo | `PUT /api/teams/:id` | Documentado para Bloque 16; confirmar antes de implementar |

> Nota: algunos documentos legacy usan variantes con prefijo `/api/admin` para matches, teams o standings. Para cualquier mutación futura no se debe inventar endpoint: primero confirmar la ruta real, permisos, payload, respuesta y efectos sobre base de datos.

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

- revisar estado de grupos desde standings oficiales;
- revisar equipos con `qualifiedTo: "ROUND_OF_32"` cuando el backend ya los exponga;
- cargar partidos de eliminatorias desde `GET /api/matches`;
- mostrar una preview read-only de clasificados y slots si hay datos suficientes;
- seleccionar un grupo A-L;
- ejecutar `POST /api/admin/classify-group` enviando solo `{ "group": "A" }`;
- pedir confirmación antes de mutar backend;
- mostrar success/error devuelto por backend;
- refrescar `GET /api/standings` y `GET /api/matches` después de una transición exitosa;
- mostrar bracket/slots actualizados sin mover equipos desde React.

Reglas:

- no calcular combinaciones de terceros desde React;
- no calcular standings, desempates ni `qualifiedTo` desde React;
- no enviar equipos, standings, posiciones ni slots desde React;
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

## Bloque 15 — Admin Transition Controls

Estado: implementado con follow-up de transición manual por grupo en `/admin/transition`.

### Intención funcional

`AdminTransitionPage` permite que un admin revise el estado operativo de grupos y 16avos y ejecute manualmente el Transition Engine backend para un grupo específico.

La transición sigue siendo autoritativa del backend: React no calcula clasificados, mejores terceros, desempates, `qualifiedTo` ni mapping definitivo de 16avos. El frontend solo selecciona una letra de grupo y envía `{ group }` al endpoint confirmado.

La UI pública de `/eliminatorias` continúa siendo read-only y solo refleja partidos actualizados recibidos desde `GET /api/matches`; no contiene controles admin.

### Contrato backend confirmado

Endpoint confirmado para el follow-up del Bloque 15:

| Acción | Método y ruta | Body | Credenciales | Respuesta esperada |
| --- | --- | --- | --- | --- |
| Procesar transición de grupo | `POST /api/admin/classify-group` | `{ "group": "A" }` | `withCredentials: true` | `{ status, message }` |

Reglas del contrato frontend:

- `group` debe ser una letra de `A` a `L`.
- El frontend no envía equipos, standings, posiciones, slots, `qualifiedTo` ni placeholders.
- El backend ejecuta la lógica equivalente a `TransitionService.allocateGroupQualifiers(group)`.
- El backend calcula los clasificados del grupo, resuelve las reglas necesarias y actualiza/injecta los equipos en el bracket de 16avos.
- La respuesta visible de éxito se muestra usando `message` devuelto por backend.
- Si el backend devuelve error con `message`, la pantalla muestra ese mensaje; si no existe, usa fallback en español.

### Estado actual detectado

- `/admin/transition` está registrada en `ADMIN_ROUTES.transition` y protegida por `AdminProtectedRoute` dentro de `AdminLayout`.
- El sidebar admin muestra `Transición` como entrada habilitada hacia `/admin/transition`.
- `AdminTransitionPage` carga standings con `getAdminTransitionStandings` desde `GET /api/standings` y partidos con `getAdminTransitionMatches` desde `GET /api/matches`, ambos con `withCredentials: true`.
- `getTransitionReadiness` calcula señales operativas no autoritativas: grupos detectados, equipos con posición, equipos ya marcados `ROUND_OF_32`, partidos de 16avos, slots reales y slots pendientes.
- La preview read-only muestra datos ya recibidos desde backend; no decide clasificados definitivos.
- `processGroupTransition(group)` ejecuta el endpoint confirmado `POST /api/admin/classify-group` enviando únicamente `{ group }` con `withCredentials: true`.
- Después de una transición exitosa, la página refresca standings y matches para mostrar el estado actualizado.

### UI implementada en `/admin/transition`

La pantalla incluye:

- título visible `Transición a 16avos`;
- copy explicativo de que la transición se ejecuta por grupo;
- selector `Grupo a procesar` con opciones `Grupo A` a `Grupo L`;
- botón `Refrescar datos` para recargar standings y matches sin mutar backend;
- botón `Ejecutar transición a 16avos` habilitado solo cuando hay grupo seleccionado y no hay carga/request en curso;
- confirmación previa con el grupo seleccionado: `¿Querés procesar el Grupo A e inyectar sus clasificados en 16avos?`;
- estado de loading durante la ejecución con copy `Procesando transición…`;
- success visible con el `message` devuelto por backend;
- error visible con el `message` devuelto por backend o fallback `No se pudo ejecutar la transición del grupo seleccionado.`;
- nota explícita: React solo envía `{ group }` y no envía equipos, standings, posiciones ni slots.

Copy funcional relevante:

- `La transición se ejecuta por grupo. El frontend solo envía el grupo seleccionado; el backend revisa standings, clasificados y slots de 16avos.`
- `Si más adelante corregís una clasificación desde el área admin correspondiente, podés volver a procesar el grupo para actualizar sus inyecciones en el bracket.`

### Flujo de datos implementado

1. El admin inicia sesión y navega a `/admin/transition`.
2. La pantalla carga standings oficiales y matches actuales con servicios admin y cookie de sesión.
3. La pantalla muestra readiness y preview read-only como apoyo visual no autoritativo.
4. El admin selecciona un grupo A-L.
5. El botón `Ejecutar transición a 16avos` se habilita si no hay carga ni request en curso.
6. Al hacer click, la UI muestra confirmación previa con el grupo seleccionado.
7. Si el admin cancela, no se ejecuta POST.
8. Si confirma, `processGroupTransition(selectedGroup)` envía `POST /api/admin/classify-group` con body `{ group: selectedGroup }`.
9. El backend procesa standings, clasificados y slots; React no calcula ni completa bracket.
10. En success, la UI muestra el mensaje backend y refresca `GET /api/standings` + `GET /api/matches`.
11. En error, la UI muestra el mensaje backend o fallback amigable.
12. La selección de grupo se mantiene para que el admin vea qué grupo procesó.

### Service layer implementado

| Función | Tipo | Endpoint | `withCredentials` | Resultado |
| --- | --- | --- | --- | --- |
| `getAdminTransitionStandings` | admin-only lectura | `GET /api/standings` | Sí | standings oficiales parseados |
| `getAdminTransitionMatches` | admin-only lectura | `GET /api/matches` | Sí | partidos parseados |
| `processGroupTransition(group)` | admin-only mutación confirmada | `POST /api/admin/classify-group` | Sí | `{ status, message }` del backend |
| `getTransitionReadiness` | helper local read-only | no aplica | no aplica | señales operativas no autoritativas |

`processGroupTransition(group)` normaliza defensivamente el grupo antes de enviarlo y rechaza grupo vacío antes de llamar al backend. No arma payloads con teams, standings, posiciones ni slots.

### Límites explícitos

No implementado en React:

- cálculo de clasificados definitivos;
- mejores terceros;
- desempates oficiales;
- mapping definitivo de 16avos;
- escritura local de `qualifiedTo`;
- escritura local de `homeTeam`/`awayTeam` en matches;
- envío de equipos o standings al backend.

### Reprocesamiento después de correcciones

Si una corrección admin posterior cambia standings, terceros o clasificados, el admin puede volver a seleccionar y procesar el grupo correspondiente desde `/admin/transition`. La reejecución debe ser segura del lado backend; el frontend solo vuelve a disparar el grupo elegido y refresca datos después del success.

### Relación con `/eliminatorias`

- `/eliminatorias` pública no muestra selector, botones ni acciones admin.
- La página pública consume datos actualizados de `GET /api/matches` y los renderiza junto al skeleton visual cuando corresponde.
- La transición manual puede impactar lo que la vista pública muestra después de un refresh, pero la vista pública no ejecuta Transition Engine.

### Validación automática

Tests cubiertos para el follow-up:

- `adminTransitionService.test.js` verifica `processGroupTransition('A')` con `POST /api/admin/classify-group`, body `{ group: 'A' }` y `{ withCredentials: true }`.
- El servicio valida grupo vacío antes de llamar al backend y no envía `teams`, `standings`, `positions` ni `slots`.
- `AdminTransitionPage.test.jsx` cubre selector A-L, botón inicialmente deshabilitado, habilitación al seleccionar grupo, confirmación, cancelación sin POST, success, error, loading de ejecución y refresh posterior.
- `AdminRoutes.test.jsx` mantiene `/admin/transition` como ruta protegida.
- `KnockoutStage.test.jsx` confirma que `/eliminatorias` no expone controles admin.

Resultado final del follow-up:

- `pnpm run lint`: passed.
- `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`: 32 test files, 317 tests passed.
- `pnpm run build`: passed con warning informativo de Vite por chunk mayor a 500 kB.

### Validación manual sugerida

- Iniciar sesión como admin.
- Entrar al dashboard admin.
- Navegar a `/admin/transition` desde el sidebar.
- Confirmar que se cargan standings y matches.
- Confirmar que el selector muestra `Grupo A` a `Grupo L`.
- Confirmar que `Ejecutar transición a 16avos` inicia deshabilitado.
- Seleccionar un grupo y confirmar que el botón se habilita.
- Cancelar la confirmación y verificar que no se ejecuta POST.
- Confirmar la acción y verificar success/error claro.
- Confirmar que después del success se refrescan standings y matches.
- Confirmar que el copy visible está en español.
- Confirmar que `/eliminatorias` pública no muestra controles admin.

### Riesgos y decisiones seguras

- Re-ejecución no idempotente: el frontend permite reprocesar por grupo porque el contrato confirmado delega la seguridad al backend; backend debe mantener idempotencia operacional.
- Mapping de 16avos cambiante: React no lo hardcodea como contrato de escritura.
- Terceros y desempates: React no los calcula.
- Mutación accidental: hay confirmación previa, botón deshabilitado sin grupo y tests de cancelación sin POST.
- Exposición pública: controles solo bajo layout admin protegido.
- Payload excesivo: tests aseguran que solo se envía `{ group }`.

### Orden recomendado siguiente

1. Validar manualmente `/admin/transition` contra backend real.
2. Confirmar comportamiento de idempotencia y errores 400/401/403/500 en backend.
3. Implementar Block 16 de correcciones de equipo si se aprueba.
4. Si Block 16 modifica datos que afectan clasificación, usar `/admin/transition` para reprocesar el grupo impactado.
5. Mantener tests de payload mínimo y ausencia de controles admin públicos.

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
