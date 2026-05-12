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
| Listar equipos | `GET /api/teams` | Confirmado para Bloque 16 |
| Listar equipo por ID | `GET /api/teams/:id` | Confirmado; no usado de forma obligatoria por la pantalla actual |
| Buscar equipo por nombre | `GET /api/teams/name/:name` | Confirmado |
| Recalcular standings de grupo | `POST /api/standings/:group` | Confirmado, protegido por `verifyAdmin` en backend |
| Clasificar grupo a eliminatorias | `POST /api/admin/classify-group` | Confirmado en follow-up del Bloque 15 con body `{ group }`; frontend solo envía el grupo y backend calcula/injecta clasificados |
| Corrección manual de equipo | `PUT /api/teams/:id` | Confirmado para Bloque 16; ruta sin prefijo `/api/admin`, protegida en backend con `verifyAdmin` |

> Nota: algunos documentos legacy usan variantes con prefijo `/api/admin` para mutaciones de standings. El contrato real de recálculo es `POST /api/standings/:group`.

> Importante para Bloque 16: no existe `GET /api/teams/group/:group`; `GET /api/teams` no trae paginación y se filtra por grupo en frontend para `/admin/teams-corrections`.

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
- disparar `POST /api/standings/:group` tras confirmación cuando el grupo esté listo;
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

Estado: implementado con follow-up para habilitar recálculo manual en `/admin/groups` usando contrato confirmado.

### Intención funcional

El módulo `Admin Groups & Standings Controls` debe darle al admin una vista operativa de grupos y standings sin mover la lógica deportiva al frontend.

Responsabilidades implementadas:

- visualizar grupos A-L y permitir seleccionar un grupo;
- revisar cuántos partidos del grupo están finalizados;
- revisar standings actuales consumidos desde `GET /api/standings`;
- mostrar avisos de grupo pendiente, incompleto, listo para revisar o listo para acción backend;
- mostrar el control de recálculo con explicación de que la lógica de cálculo vive en backend;
- disparar POST solo tras confirmación y cuando el grupo está completo (6 partidos finalizados);
- mostrar errores amigables cuando la cookie admin falte, expire o el backend rechace la acción;
- usar `withCredentials: true` explícito en la mutación admin.

### Responsabilidades sobre datos derivados

Standings, posiciones, diferencias de gol, puntos, clasificados y `qualifiedTo` son datos derivados o gestionados por motores backend.

El frontend admin puede:

- mostrar esos datos;
- advertir cuando los datos puedan estar desactualizados después de editar resultados;
- disparar recálculo cuando el contrato esté confirmado y el grupo complete los 6 partidos.
- guiar al admin hacia el siguiente flujo aprobado.

El frontend admin no debe:

- recalcular standings desde partidos;
- editar puntos, goles a favor, goles en contra o diferencia de gol manualmente;
- calcular mejores terceros;
- asignar `qualifiedTo` por su cuenta;
- sembrar eliminatorias desde `/admin/groups`;
- usar endpoints no confirmados para corregir inconsistencias.

El flujo ahora usa `POST /api/standings/:group` tras confirmación y refresca `GET /api/standings` + `GET /api/matches`.

El contrato confirmado no usa prefijo `/api/admin`, pero el endpoint es privado y depende de sesión/cookie (`verifyAdmin`), por lo que la pantalla solo lo usa en contexto admin con `withCredentials: true`.

### Preguntas abiertas para backend

- `POST /api/standings/:group` está confirmado.
- Pendiente: confirmar si requiere body o funciona solo con `group` en la URL.
- Pendiente: confirmar formato de respuesta del recálculo (si devuelve standings actualizados o solo mensaje de estado).

### Validaciones manuales futuras

Después de la implementación del Bloque 14, validar manualmente:

- acceso protegido a `/admin/groups` solo con sesión admin vigente;
- redirect a `/admin/login` cuando la cookie no esté disponible;
- llamadas admin con `withCredentials` y sin tokens en `localStorage` o `sessionStorage`;
- carga de grupos y standings actuales;
- estados de loading, empty, error y retry;
- mensajes claros para grupos con partidos pendientes;
- acción de recálculo habilitada solo con grupo completo (6 partidos finalizados) y en estado de acción confirmada;
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
- recalcular standings desde React;
- editar manualmente puntos, posiciones, diferencia de gol o criterios de desempate en frontend;
- crear lógica local de standings;
- agregar persistencia nueva para predicciones.

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

## Bloque 16 — Admin Team Corrections

Estado: implementado y validado automáticamente.

### Diagnóstico

Después del follow-up del Bloque 15, el Admin Zone ya puede ejecutar la transición manual por grupo desde `/admin/transition` enviando solo `{ group }` al backend. El siguiente riesgo operativo está en los datos de equipos que alimentan esa transición:

- `position` define si el equipo encaja como `1st Group X`, `2nd Group X` o un caso equivalente autorizado por backend;
- `qualifiedTo` define si el Transition Engine considera al equipo para 16avos u otra instancia;
- `shieldUrl` impacta la visualización pública/admin de escudos o banderas.

Por eso el Bloque 16 debe ser una pantalla excepcional de corrección, no un CRUD completo de equipos. Su objetivo es resolver casos administrativos puntuales antes de reprocesar el grupo en `/admin/transition`.

### Alcance funcional implementado

- `/admin/teams-corrections` como ruta protegida.
- `Correcciones` habilitado en el sidebar.
- Mostrar equipos con filtros por grupo A-L y búsqueda por nombre.
  - Dato importante: el backend no expone `GET /api/teams/group/:group`, por eso la pantalla usa `GET /api/teams` y filtra por grupo en frontend.
- Mostrar datos actuales: nombre, grupo, posición, `qualifiedTo` y `shieldUrl`.
- Permitir editar solo:
  - `position`;
  - `qualifiedTo`;
  - `shieldUrl`.
- Bloquear edición de datos estables salvo nuevo contrato explícito:
  - `name`;
  - `group`;
  - `confederation`;
  - `_id`.
- Pedir confirmación fuerte antes de guardar, con resumen de cambios y advertencia de impacto en transición/bracket.
- Después de un guardado exitoso, refrescar equipos y mostrar mensaje en español.
- Si la corrección afecta clasificación, guiar al admin a reprocesar el grupo desde `/admin/transition`.

### Alcance técnico implementado

- Usar `axiosClient` en un servicio admin dedicado.
- Usar `withCredentials: true` explícito en llamadas privadas.
- Usar payload parcial limpio: omitir campos no modificados y strings vacíos.
- Validar valores de `position` y `qualifiedTo` antes de enviar.
- Mantener constantes técnicas en inglés y labels visibles en español.
- No calcular standings, clasificados, mejores terceros, desempates ni mapping de 16avos desde React.
- No escribir equipos, posiciones o slots de eliminatorias desde React fuera del payload de corrección confirmado.
- No almacenar tokens, cookies ni datos sensibles en `localStorage`.

### Contratos backend

Confirmado para lectura:

| Acción | Endpoint | Estado |
| --- | --- | --- |
| Listar equipos | `GET /api/teams` | Documentado como lectura pública |
| Listar equipo por ID | `GET /api/teams/:id` | Confirmado por usuario/backend; no requerido por la pantalla actual |
| Buscar equipo por nombre | `GET /api/teams/name/:name` | Confirmado por usuario/backend; no requerido por la pantalla actual |

Confirmado para mutación privada:

| Acción | Endpoint | Estado |
| --- | --- | --- |
| Actualizar equipo | `PUT /api/teams/:id` | Confirmado; protegido en backend con `verifyAdmin`; frontend admin usa `withCredentials: true` |

No usar en Bloque 16:

- `GET /api/teams/group/:group` (no existe en backend confirmado; usar `GET /api/teams` + filtros cliente).
- `PUT /api/admin/teams/:id`;
- `POST /api/teams`;
- `POST /api/admin/teams`;
- `DELETE /api/teams/:id`;
- cualquier endpoint de creación o eliminación.

Payload permitido:

```json
{
  "position": 1,
  "qualifiedTo": "ROUND_OF_32",
  "shieldUrl": "https://..."
}
```

Confirmado:

- La ruta real de mutación es `PUT /api/teams/:id`.
- Aunque no usa prefijo `/api/admin`, está protegida por `verifyAdmin`.
- El frontend debe tratarla como mutación privada y enviar `{ withCredentials: true }`.
- El payload debe ser parcial y limitado a `position`, `qualifiedTo` y `shieldUrl`.
- `qualifiedTo` usa valores canónicos o `null`.

Pendiente de backend:

- Confirmar si actualizar `position`/`qualifiedTo` dispara algún engine o solo modifica el equipo.
- Confirmar el formato exacto de respuesta para mensajes de éxito más específicos.
- Confirmar status codes finales para validación, permisos, equipo inexistente y conflictos.

### Archivos implementados

- `src/pages/AdminTeamCorrectionsPage/AdminTeamCorrectionsPage.jsx`
- `src/pages/AdminTeamCorrectionsPage/AdminTeamCorrectionsPage.module.css`
- `src/pages/AdminTeamCorrectionsPage/AdminTeamCorrectionsPage.test.jsx`
- `src/services/admin/adminTeamsService.js`
- `src/services/admin/adminTeamsService.test.js`
- `src/schemas/adminTeamCorrectionSchema.js`
- `src/schemas/adminTeamCorrectionSchema.test.js`
- `src/constants/qualifiedTo.js`
- `src/constants/adminRoutes.js`
- `src/routes/AppRoutes.jsx`
- `src/routes/AdminRoutes.test.jsx`
- `src/pages/AdminDashboardPage/AdminDashboardPage.jsx`

### Riesgos y mitigaciones

- **Ruta privada sin prefijo admin**: aunque el endpoint es `PUT /api/teams/:id`, se trata como privado porque backend usa `verifyAdmin`; el servicio usa `withCredentials: true`.
- **Uso no excepcional**: copy visible y confirmación deben dejar claro que no es un CRUD normal.
- **Inconsistencia con engines**: después de cambios que afecten clasificación, orientar a reprocesar `/admin/transition`.
- **Cálculo indebido en React**: la pantalla solo muestra y edita campos permitidos; no calcula rankings ni mejores terceros.
- **Payload excesivo**: tests deben asegurar que no se envían campos bloqueados.
- **Credenciales omitidas**: tests de servicio deben comprobar `withCredentials: true`.
- **Valores legacy**: labels pueden ayudar a leer datos antiguos, pero el payload debe usar valores canónicos confirmados.

### Criterios de aceptación implementados

- `/admin/teams-corrections` está protegida por la sesión admin.
- La navegación admin habilita `Correcciones`.
- La pantalla muestra loading, delayed loading si aplica, empty, error y retry.
- La lectura de equipos usa contratos confirmados.
- La mutación real usa `PUT /api/teams/:id`, no `/api/admin/teams/:id`.
- El servicio usa `axiosClient` con `withCredentials: true`.
- Solo se pueden editar `position`, `qualifiedTo` y `shieldUrl`.
- El payload enviado es parcial, limpio y no contiene `name`, `group`, `confederation`, standings, slots ni objetos completos.
- Hay confirmación fuerte antes de guardar.
- La UI visible está en español.
- Después de guardar, la UI refresca equipos y sugiere reprocesar el grupo en `/admin/transition` cuando corresponda.
- Tests cubren ruta protegida, servicio, payload, confirmación/cancelación, estados, ausencia de creación/eliminación y ausencia de controles públicos.

### Validaciones manuales sugeridas

- Acceder sin sesión a `/admin/teams-corrections` y confirmar redirect a `/admin/login`.
- Acceder con sesión admin y confirmar que se listan equipos.
- Filtrar por grupo A-L y buscar por nombre.
- Intentar guardar sin cambios y verificar que no se envía payload innecesario.
- Editar `position`, `qualifiedTo` o `shieldUrl`, revisar confirmación y cancelar sin mutar.
- Confirmar guardado contra backend real.
- Verificar success/error amigable en español.
- Confirmar que no se pueden editar `name`, `group` ni `confederation`.
- Confirmar que `/eliminatorias`, `/posiciones` y rutas públicas no muestran controles admin.
- Después de una corrección que afecte clasificación, reprocesar el grupo en `/admin/transition`.

### Validaciones automáticas sugeridas

- `adminTeamsService.test.js`: lectura, mutación confirmada, `withCredentials`, payload parcial y errores.
- `AdminTeamCorrectionsPage.test.jsx`: loading, empty, error, filtros, edición, confirmación, cancelación, success/error.
- `AdminRoutes.test.jsx`: ruta protegida y navegación.
- Tests de constantes/schemas para `qualifiedTo`, `position`, `shieldUrl` y rechazo de valores no permitidos.
- `KnockoutStage.test.jsx` o test de rutas públicas: no exponer controles admin.
- En QA Mode: `pnpm run lint`, `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`, `pnpm run build` después del preflight WSL.

Resultado final del Bloque 16:

- `pnpm run lint`: passed.
- `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`: 35 test files, 352 tests passed.
- `pnpm run build`: passed con warning informativo de Vite por chunk mayor a 500 kB.

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
- `/admin/groups` revisa standings oficiales y habilita recálculo manual de standings con `POST /api/standings/:group` tras confirmación, refrescando datos del backend.
- Transition llama al Transition Engine.
- Finalizar eliminatoria confía en el Bracket Engine y refresca matches.
- Correcciones de equipos están limitadas y confirmadas.
- La app pública refleja datos actualizados sin duplicar engines.
