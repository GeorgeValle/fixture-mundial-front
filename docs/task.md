# Tablero de tareas del proyecto

## Estado actual

- Bloque actual: follow-up de `/posiciones` — corrección P2 de badges históricos de fase de grupos implementada y validada automáticamente.
- Último bloque de planificación completado: Bloque 17 — Admin Knockouts Controls & Public Knockout Polish.
- Último bloque de implementación admin completado: Bloque 17 — Admin Knockouts Controls & Public Knockout Polish.
- Último bloque de implementación completado: Bloque 18 — Vista de llaves pública en Eliminatorias.
- Estado actual: Bloque 14 fue activado con recálculo manual confirmado (`POST /api/standings/:group`) y validado como seguimiento operativo de admin.
- Siguiente bloque sugerido tras aprobación/finalización: pendiente de definir tras validación manual del Bloque 18.
- Objetivo: operar una consola admin específica para eliminatorias que carga resultados con `PUT /api/matches/:id`, confía en el Bracket Engine backend y verifica que `/eliminatorias` no exponga controles admin.
- Objetivo follow-up actual: `/posiciones` debe mostrar clasificación histórica desde fase de grupos sin confirmar top-2 en grupos incompletos ni eliminar terceros con contexto parcial de 16avos.
- Estado de validación manual: Bloque 18 pasó validación automática (`TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run lint`, `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test`; 39 archivos de test, 381 tests, y `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run build`). Queda pendiente validación manual de usuario.
- Estado de validación del follow-up `/posiciones`: runtime WSL verificado con Node/pnpm Linux en `/home/yorch/.nvm/versions/node/v24.14.0/bin`; pasaron `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm test` (41 archivos, 434 tests), `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run lint` y `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run build`.

## Reglas críticas de ejecución

- Trabajar dentro del proyecto React + Vite existente.
- Usar solo JavaScript, CSS Modules y pnpm.
- No recrear ni re-scaffoldear el proyecto.
- No documentar rutas administrativas del backend como uso público del frontend.
- Mantener los detalles largos de páginas en documentos específicos por página.
- Mantener este archivo como tablero/checklist breve.
- `build`/`lint`/`test` deben ejecutarse solo en QA Mode o validación final.
- La planificación de Admin Zone vive en `docs/admin-dashboard.md`; no implementar archivos fuente admin hasta que el bloque correspondiente esté aprobado.

## Checklist de bloques

### Bloque 1 — Arquitectura base

- [x] Router configurado.
- [x] Redux Toolkit configurado.
- [x] Cliente Axios configurado.
- [x] Base global de errores/feedback configurada.
- [x] Tests base configurados.

### Bloque 2 — Base UI compartida

- [x] Utilidades de fecha.
- [x] Skeleton loaders.
- [x] Helpers de delayed loading.
- [x] Selectores de estado UI compartido.

### Bloque 3 — Fixture de grupos

- [x] Página `/grupos` implementada.
- [x] Selector de grupo implementado.
- [x] Cards de partidos del fixture implementadas.
- [x] Parseo de partidos del backend implementado.
- [x] Tests agregados y validados manualmente.

### Bloque 4 — Agenda diaria de Home

- [x] Endpoint de agenda diaria integrado.
- [x] Fallback de hoy/siguiente fecha implementado.
- [x] Estados de loading, delayed loading, empty y error implementados.
- [x] Tests agregados y validados manualmente.
- [x] Follow-up completado: formatear `nextDate` con un formato de fecha amigable en español.

### Bloque 5 — Posiciones de grupos

- [x] Confirmar la forma de respuesta pública del backend para `GET /api/standings`.
- [x] Implementar servicio/schema de standings.
- [x] Implementar página `/posiciones`.
- [x] Renderizar cards/tablas de standings por grupo.
- [x] Agregar estados de loading, empty, error y delayed loading.
- [x] Agregar tests.
- [x] Validación manual del usuario.
- [x] Follow-up: separar badges históricos de grupo de `team.qualifiedTo`.
- [x] Follow-up: inferir mejores terceros clasificados por presencia en partidos reales de eliminatorias (`matchNumber >= 73`) sin recalcular standings.
- [x] Follow-up PR #31 P2: no confirmar posiciones 1/2 hasta grupo completo y no eliminar terceros sin contexto confiable de 16avos.

### Bloque 6 — Knockout Stage

- [x] Revisar documentación de knockout y fuente del skeleton.
- [x] Crear datos locales del skeleton de knockout.
- [x] Implementar estrategia de merge backend/skeleton.
- [x] Implementar página `/eliminatorias`.
- [x] Implementar selector de ronda.
- [x] Implementar componentes de bracket, ronda y match-card.
- [x] Renderizar labels visibles de UI en español.
- [x] Manejar estados de loading, delayed loading, error, empty/skeleton y datos parciales.
- [x] Agregar adapter y tests de render.
- [x] Ejecutar `pnpm run build`.
- [x] Ejecutar `pnpm run lint`.
- [x] Ejecutar `pnpm run test`.
- [x] Validación manual del usuario.

### Bloque 7 — Prediction Fixture

- [x] Definir modelo de predicciones en localStorage.
- [x] Implementar almacenamiento de predicciones, schemas, locking, scoring y utilidades de validación.
- [x] Implementar UI base de `/predicciones`.
- [x] Implementar captura del nombre de usuario.
- [x] Implementar cards de predicción para partidos de fase de grupos.
- [x] Habilitar predicciones knockout para cruces reales con ambos equipos definidos.
- [x] Evitar predicciones sobre placeholders o partidos knockout solo de skeleton.
- [x] Implementar bloqueo de predicciones por `status` y `date`.
- [x] Implementar scoring de fase de grupos.
- [x] Implementar scoring knockout sobre goles normales sin puntos por penales ni clasificado visual.
- [x] Implementar validación de clasificado visual obligatorio en empates knockout.
- [x] Implementar selector visual de clasificado para empates knockout sin inputs de penales.
- [x] Comparar predicción del usuario contra resultado final registrado cuando el partido esté finalizado.
- [x] Mostrar predicción del usuario, resultado final registrado, puntos e indicadores.
- [x] Manejar localStorage corrupto con reset guiado.
- [x] Agregar filtro por grupo.
- [x] Agregar controles de reset para el grupo seleccionado y todas las predicciones editables.
- [x] Agregar soporte de impresión con `window.print()`.
- [x] Agregar modales de resumen/ayuda y pulido final de UI.
- [x] Agregar tests para scoring, locking, localStorage, validación, eliminatorias, estados de UI e impresión.
- [x] Ejecutar `pnpm run build`.
- [x] Ejecutar `pnpm run lint`.
- [x] Ejecutar `pnpm run test`.
- [x] Validación manual del usuario.

Nota: la UI pública de predicciones knockout no pide penales. En empates, el usuario elige quién clasifica como dato visual/informativo; esa selección no suma puntos.

### Bloque 8 — Documentación y revisión final

- [x] Revisar documentación actual.
- [x] Reemplazar README genérico de Vite por README del proyecto.
- [x] Crear contrato público de API para el frontend.
- [x] Actualizar documentación específica por página.
- [x] Limpiar tablero de tareas e índice de documentación.
- [x] Alinear requisitos del proyecto con el alcance actual.
- [x] Pulido opcional futuro de textos en UI visible.
- [x] Validación final en QA Mode.


### Bloque 9 — Pulido visual, accesibilidad y readiness de producción

- [x] Revisar `DESIGN.md` antes de cambios visuales.
- [x] Documentar alcance del Bloque 9 y checklist de QA.
- [x] Aumentar timeout de Axios para soportar copy de server wake-up lento.
- [x] Agregar copy humano para servidor lento explicando que el wake-up puede tardar hasta 30 segundos.
- [x] Agregar botones de retry a estados de error alimentados por backend.
- [x] Reemplazar copy técnico visible como backend/skeleton/placeholders cuando sea user-facing.
- [x] Agregar persistencia de grupo favorito con localStorage.
- [x] Usar grupo favorito como grupo inicial en `/grupos` y `/posiciones`.
- [x] Agregar página 404 personalizada para ruta `*`.
- [x] Pulir cards, contenedores de estado, badges, headers y espaciado.
- [x] Agregar detalles decorativos sutiles CSS/SVG sin afectar la legibilidad.
- [x] Mejorar accesibilidad de modales y nuevos botones de favorito/retry/404.
- [x] Agregar manifest PWA instalable básico, íconos y theme color.
- [x] Actualizar favicon, title, meta description y metadatos Open Graph.
- [x] Agregar o actualizar tests para 404, grupo favorito, copy de retry/loading y comportamientos clave de accesibilidad.
- [x] Validación final en QA Mode después de la implementación.


### Bloque 10 — Onboarding, Navbar y pulido progresivo de UI

- [x] Revisar `DESIGN.md`, `docs/task.md` y documentación del Bloque 9 antes de cambios visuales.
- [x] Verificar runtime WSL Node/pnpm antes de la implementación.
- [x] Verificar nombres de archivos SVG asset y referencias.
- [x] Normalizar a minúsculas el nombre del archivo de ilustración de estadio cuando se confirmó que no estaba usado.
- [x] Crear documentación del Bloque 10.
- [x] Implementar Parte 1 — Onboarding, Navbar y SVG Assets.
- [x] Agregar tutorial de primera visita en Home con persistencia en localStorage.
- [x] Agregar entrada manual `Ver tutorial` desde Navbar.
- [x] Reemplazar visual de pelota del Navbar con `soccerballnoshadow.svg` preservando la lógica de menú.
- [x] Usar `silbato-web.svg` para el botón de tutorial/ayuda.
- [x] Preservar `aria-label`, `aria-expanded`, `aria-controls`, comportamiento Escape y estados focus-visible.
- [x] Agregar tests para comportamiento de Parte 1.
- [x] Ejecutar validación final de Parte 1.
- [x] Corregir issue de validación manual donde el tutorial de Home se renderizaba debajo de elementos de página y bloqueaba/fallaba clicks de botones.
- [x] Corregir segundo issue de validación manual: alinear spotlight a targets reales `data-tour`, evitar solapamiento panel/target y prevenir que el tutorial compita con overlays de feedback/loading.
- [x] Corregir tercer issue de validación manual: mantener estable el paso de tutorial `home-sections` con ubicación fija de panel y scroll conservador.
- [x] Validación manual del usuario sobre la UI corregida del tutorial de Parte 1.
- [x] Implementar Parte 2 — refinamiento de Home, Group Fixtures y Standings.
- [x] Convertir chips de Home en quick links reales.
- [x] Refinar balance visual del hero de Home.
- [x] Refinar panel superior de controles de `/grupos` y resumen seguro de grupo.
- [x] Refinar hero de `/posiciones` y panel de controles de standings.
- [x] Agregar/actualizar tests de Parte 2.
- [x] Implementar Parte 3 — Knockout, Predictions, consistencia y tests.
- [x] Refinar `/eliminatorias` como Camino a la final sin inventar datos.
- [x] Agregar chips accesibles de ronda knockout sincronizados con el filtro select.
- [x] Refinar `/predicciones` como dashboard de predicciones sin cambiar scoring/storage.
- [x] Aplicar pulido controlado de consistencia para chips, badges, cards, estados focus y danger zone dentro del alcance de Parte 3.
- [x] Agregar/actualizar tests de Parte 3.
- [x] Bloque 10 listo para revisión final de QA.
- [x] Ejecutar validación final de QA para Bloque 10.
- [x] Cerrar Bloque 10.

### Bloque 11 — Planificación de Admin Zone y alineación con motores backend

- [x] Crear `docs/admin-dashboard.md`.
- [x] Alinear el plan de Admin Zone con los motores backend de Standings, Transition y Bracket.
- [x] Definir rutas admin, sectores, servicios, componentes y flujo.
- [x] Registrar inconsistencias legacy que necesitan normalización antes o durante la implementación.
- [x] Mantener este bloque solo documental; sin cambios en `src/`, build, lint ni tests.

### Bloque 12 — Admin Auth y layout protegido

- [x] Implementar `/admin/login`.
- [x] Implementar redirects de `/admin` y `/admin/dashboard`.
- [x] Implementar `AdminProtectedRoute`.
- [x] Implementar `AdminLayout` con sidebar.
- [x] Implementar `authSlice` o estado de auth equivalente.
- [x] Implementar login/logout con cookie `HttpOnly` y `withCredentials`.
- [x] Restaurar sesión con `GET /api/auth/me` si está disponible.
- [x] Agregar tests de auth/routing admin.
- [x] Corrección final: logout envía `{}` con `withCredentials`, limpia estado de auth Redux y redirige a `/admin/login`.
- [x] Ejecutar `pnpm run build`.
- [x] Ejecutar `pnpm run lint`.
- [x] Ejecutar `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` después de que el temp path por defecto de Vitest falló bajo `/mnt/c`.

### Bloque 13 — Controles admin de resultados de partidos

- [x] Implementar `/admin/matches`.
- [x] Listar y filtrar partidos por grupo, stage y status.
- [x] Cargar goles regulares y status.
- [x] Manejar `PLAYING` y `FINISHED`.
- [x] Cargar penales para partidos knockout empatados.
- [x] Enviar payloads parciales con `PUT /api/matches/:id`.
- [x] Refrescar partidos después de guardar.
- [x] No mover equipos ni recalcular brackets desde React.
- [x] Ejecutar `pnpm run build`.
- [x] Ejecutar `pnpm run lint`.
- [x] Ejecutar `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` (28 archivos de test, 289 tests).

### Bloque 14 — Controles admin de grupos y standings

- [x] Implementar `/admin/groups` como ruta admin protegida.
- [x] Habilitar `Grupos` en el sidebar admin.
- [x] Cargar partidos admin con `GET /api/matches` y `withCredentials` explícito desde `adminMatchesService`.
- [x] Cargar standings con `GET /api/standings` y `withCredentials` explícito desde `adminStandingsService`.
- [x] Mostrar selector de grupo A-L.
- [x] Mostrar conteos operativos por status: `PENDING`, `PLAYING`, `FINISHED` y total esperado del grupo.
- [x] Normalizar defensivamente `IN_PROGRESS` legacy a `PLAYING` para conteos.
- [x] Mostrar standings actuales del grupo seleccionado como datos oficiales del backend.
- [x] Mostrar estados de loading, empty, error y retry.
- [x] Habilitar recálculo manual con `POST /api/standings/:group` para grupos completos (6 partidos finalizados).
- [x] No calcular standings, mejores terceros, clasificados ni `qualifiedTo` en React.
- [x] No implementar transition, correcciones de equipos, controles knockout ni modificación de bracket.
- [x] Agregar tests de protección de ruta, carga de datos, selector de grupo, conteos de status, empty/error/retry, confirmación/cancelación, recálculo y refresh.
- [x] Registrar en tests la confirmación manual y que no haya POST sin confirmación.
- [x] Ejecutar `pnpm run build`.
- [x] Ejecutar `pnpm run lint`.
- [x] Ejecutar `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` (35 archivos de test, 352 tests).

### Bloque 15 — Admin Transition Controls

- [x] Planificar el flujo grupos → 16avos en Plan Mode.
- [x] Documentar que no se implementó código, servicios, componentes ni rutas en este bloque.
- [x] Revisar docs y código existente: standings, knockout, admin groups, servicios admin y patrón `withCredentials`.
- [x] Confirmar que la app pública `/eliminatorias` ya lee `GET /api/matches` y mergea datos reales con skeleton sin ejecutar lógica admin.
- [x] Definir `/admin/transition` como ubicación recomendada para no mezclar revisión de standings con siembra de eliminatorias.
- [x] Registrar que la acción real debe ser admin-only y no debe aparecer en rutas públicas.
- [x] Registrar que el frontend no debe calcular standings, mejores terceros, desempates, `qualifiedTo` ni mapping definitivo de 16avos.
- [x] Registrar contrato backend pendiente antes de habilitar mutaciones reales, aunque la documentación disponible mencione `POST /api/admin/classify-group`.
- [x] Confirmar con backend la ruta real, método y body de `POST /api/admin/classify-group`; quedan como consideraciones operativas los detalles de idempotencia completa y casos de negocio.
- [ ] Confirmar si el contrato expone una vista previa de clasificados o si la vista previa debe ser de solo lectura desde `GET /api/standings` + `GET /api/matches`.
- [ ] Confirmar cómo se resuelven mejores terceros, empates absolutos, Fair Play/sorteos y slots tipo `3rd Group A/B/C/D/F`.
- [x] En Build Mode, crear `AdminTransitionPage` protegida en `/admin/transition`.
- [x] En Build Mode, habilitar `Transición` en el sidebar como pantalla de revisión/vista previa.
- [x] En Build Mode, crear `adminTransitionService` con lecturas `GET /api/standings` y `GET /api/matches`, ambas con `withCredentials: true`.
- [x] En Build Mode, no crear función activa `transitionGroupsToKnockout` para evitar mutaciones accidentales con contrato pendiente.
- [x] En Build Mode, mostrar estado inicial, loading, error, empty, vista previa de solo lectura y acción deshabilitada por contrato pendiente.
- [x] En Build Mode inicial, mantener bloqueada la acción real `Ejecutar transición a 16avos` hasta confirmar contrato backend.
- [x] En Build Mode, agregar botón `Refrescar datos` para recargar standings y partidos sin mutar backend.
- [x] En Build Mode, agregar tests de ruta protegida, acción deshabilitada, preview, no POST sin contrato, `withCredentials` y ausencia de controles admin en UI pública.
- [x] Registrar resultado final de `pnpm run lint` — aprobado.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 32 archivos de test, 310 tests aprobados en la primera implementación segura.
- [x] Registrar resultado final de `pnpm run build` — aprobado con advertencia Vite de chunk mayor a 500 kB.
- [x] Follow-up del Bloque 15: habilitar transición manual por grupo dentro de `/admin/transition`.
- [x] Confirmar contrato backend para transición manual: `POST /api/admin/classify-group` con body `{ group: "A" }`.
- [x] Agregar selector `Grupo a procesar` con opciones A-L y valores enviados `A`-`L`.
- [x] Habilitar `Ejecutar transición a 16avos` solo cuando hay grupo seleccionado y no hay carga/request en curso.
- [x] Agregar confirmación previa con el grupo seleccionado antes de enviar el POST.
- [x] Implementar `processGroupTransition(group)` con `axiosClient.post('/api/admin/classify-group', { group }, { withCredentials: true })`.
- [x] Mantener React como disparador administrativo: no envía teams, standings, posiciones ni slots; no calcula clasificados, mejores terceros, desempates ni mapping.
- [x] Mostrar éxito/error devueltos por backend y mensaje alternativo claro en español.
- [x] Refrescar standings y matches después de una transición exitosa manteniendo seleccionado el grupo procesado.
- [x] Actualizar tests de servicio y página para selector, confirmación, cancelación, éxito/error, refresh y payload mínimo.
- [x] Registrar resultado final de `pnpm run lint` del follow-up — aprobado.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` del follow-up — 32 archivos de test, 317 tests aprobados.
- [x] Registrar resultado final de `pnpm run build` del follow-up — aprobado con advertencia Vite de chunk mayor a 500 kB.

### Bloque 16 — Admin Team Corrections

- [x] Planificar Bloque 16 sin tocar `src/` ni ejecutar build/lint/test.
- [x] Identificar que el siguiente paso lógico es `/admin/teams-corrections` porque la transición manual ya existe y puede requerir correcciones excepcionales de equipos antes de reprocesar un grupo.
- [x] Documentar que el uso debe ser excepcional: empates absolutos, Fair Play/sorteos, mejores terceros, corrección de `qualifiedTo` o `shieldUrl`.
- [x] Confirmar que React no debe calcular standings, clasificados, mejores terceros, desempates ni mapping de cruces.
- [x] Registrar contratos confirmados para lectura de equipos: `GET /api/teams`, `GET /api/teams/:id` y `GET /api/teams/name/:name`.
- [x] Confirmar contrato real de mutación: `PUT /api/teams/:id`, protegido en backend por `verifyAdmin`; no usar `/api/admin/teams/:id`.
- [x] Confirmar payload permitido para corrección de equipo: `position`, `qualifiedTo`, `shieldUrl`; `qualifiedTo` acepta valores canónicos o `null`.
- [x] Implementar `/admin/teams-corrections` como ruta protegida.
- [x] Habilitar `Correcciones` en el sidebar.
- [x] Crear servicio admin de equipos con `axiosClient` y `withCredentials: true` explícito.
- [x] Listar/filtrar equipos por grupo y búsqueda usando `GET /api/teams`.
- [x] Permitir editar únicamente `position`, `qualifiedTo` y `shieldUrl`; no editar `name`, `group`, `confederation` ni `_id`.
- [x] Enviar payload parcial limpio y pedir confirmación fuerte antes de guardar.
- [x] Mostrar éxito/error en español y sugerir reprocesar el grupo en `/admin/transition` cuando corresponde.
- [x] Agregar tests de ruta protegida, servicio, payload parcial, confirmación/cancelación, estados loading/error/empty, `withCredentials` y no exposición pública.
- [x] Registrar resultado final de `pnpm run lint` — aprobado.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 35 archivos de test, 352 tests aprobados.
- [x] Registrar resultado final de `pnpm run build` — aprobado con advertencia Vite de chunk mayor a 500 kB.

### Bloque 17 — Admin Knockouts Controls & Public Knockout Polish

- [x] Mantener el detalle de planificación en `docs/admin-knockouts.md` y este tablero como checklist liviano.
- [x] Planificar Bloque 17 antes de implementar en Build Mode.
- [x] Crear `/admin/knockouts` como ruta protegida dedicada.
- [x] Habilitar `Eliminatorias` en el sidebar admin.
- [x] Reutilizar contratos confirmados: `GET /api/matches` y `PUT /api/matches/:id` con `withCredentials: true`.
- [x] Mostrar `matchNumber`, fase, equipos reales/placeholders, `nextMatchWinner`, `nextMatchLoser`, status, scores y penales.
- [x] No editar equipos, placeholders, `nextMatchWinner` ni `nextMatchLoser`; no calcular ganadores en React.
- [x] Refrescar `GET /api/matches` después de guardar para reflejar la progresión del Bracket Engine.
- [ ] Confirmar contra backend real la idempotencia al re-guardar eliminatorias finalizadas y el comportamiento al corregir resultados ya propagados.
- [x] Confirmar con tests que `/eliminatorias` renderiza sin controles admin y sigue separada del Admin Zone.
- [x] Mantener predicciones knockout fuera de alcance: no habilitarlas en este bloque salvo validación futura con cruces reales.
- [x] Agregar tests de ruta protegida, sidebar, filtrado knockout, metadata de bracket, payload parcial, penales obligatorios, confirmación, refresh, estados empty/error/retry, UI pública y predicciones knockout cerradas.
- [x] Registrar resultado final de `pnpm run lint` — aprobado.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 36 archivos de test, 361 tests aprobados.
- [x] Registrar resultado final de `pnpm run build` — aprobado con advertencia Vite de chunk mayor a 500 kB.


### Bloque 18 — Vista de llaves pública en Eliminatorias

- [x] Mantener intacta la vista actual de partidos, filtros por ronda y cards existentes.
- [x] Agregar toggle accesible “Vista de partidos” / “Vista de llaves”.
- [x] Mostrar filtros de ronda solo en la vista de partidos.
- [x] Mostrar el cuadro completo en la vista de llaves.
- [x] Refinar la vista de llaves como bracket compacto con nodos pequeños de dos filas, sin badges, fechas, estadios ni número de partido visible.
- [x] Ajustar la final como nodo central de convergencia entre semifinales, sin columna final normal.
- [x] Renderizar la vista de llaves sin marcas externas, logos propietarios ni tabla central de terceros.
- [x] No simular avance de equipos si el backend no devuelve el equipo persistido en el partido futuro.
- [x] Marcar slots como ganador, eliminado, pendiente o por definir.
- [x] Contemplar penales para determinar ganador/perdedor en empates de eliminatorias.
- [x] Mostrar el partido por el tercer puesto como ronda clara y separada de la final.
- [x] Resolver mobile con scroll horizontal legible, sin apilar el bracket completo en una columna.
- [x] Agregar tests de toggle, rondas, placeholders, ganador/perdedor, penales y ausencia de branding/keys técnicas.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run lint` — aprobado.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` — 39 archivos de test y 381 tests aprobados.
- [x] Registrar resultado final de `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run build` — aprobado con advertencia informativa de Vite por chunk mayor a 500 kB.

## Watchlist de normalización de Admin Zone

- Los documentos backend `docs/worldcup2026/*` solicitados para revisión no están presentes en el workspace; se usaron en su lugar los docs backend de raíz.
- Algunos docs backend usan endpoints admin legacy o contradictorios. El contrato confirmado actual de implementación admin es:
  - `PUT /api/matches/:id`
- Contratos a confirmar antes de futuros bloques admin:
  - recálculo de standings bloqueado por contrato sin resolver? `POST /api/standings/:group` quedó confirmado y habilitado; revisar si requiere body y/o retorna standings actualizados.
  - team corrections: contrato confirmado `PUT /api/teams/:id`, protegido por `verifyAdmin`; no usar `PUT /api/admin/teams/:id`, `POST /api/teams` ni endpoints de creación
  - group transition: contrato confirmado para `POST /api/admin/classify-group` con body `{ group }`; frontend solo dispara por grupo con cookie admin y backend ejecuta `TransitionService.allocateGroupQualifiers(group)`
  - team listing: no usar `GET /api/teams/group/:group`; para `/admin/teams-corrections` usar `GET /api/teams` y filtro por grupo en frontend.
- Valores `qualifiedTo` legacy que necesitan normalización:
  - `16AVOS` -> `ROUND_OF_32`
  - `OCTAVOS` -> `ROUND_OF_16`
  - `CUARTOS` -> `QUARTER_FINALS`
  - `SEMIFINAL` -> `SEMI_FINALS`
  - `3RO` -> `THIRD_PLACE_MATCH`
  - `ELIMINADO` -> `ELIMINATED`
- Status de partido legacy que necesita normalización:
  - `IN_PROGRESS` -> `PLAYING`
- Campo legacy de imagen de equipo que necesita normalización:
  - `flagUrl` -> `shieldUrl`

## Índice de documentación

- README principal: `README.md`
- Requisitos del proyecto: `docs/project-requirements.md`
- Contrato público de API: `docs/api-contract.md`
- Planificación de Admin Zone: `docs/admin-dashboard.md`
- Planificación de Admin Knockouts: `docs/admin-knockouts.md`
- Home: `docs/home.md`
- Fixture de grupos: `docs/group-fixtures.md`
- Standings de grupos: `docs/group-standings.md`
- Knockout stage: `docs/knockout-stage.md`
- Referencia de skeleton knockout: `docs/knockout-stage-skeleton.md`
- Prediction fixture: `docs/prediction-fixture.md`
- Referencia backend expandida: `docs/API-Backend-Mundial-2026.md`
- Notas de API backend: `docs/api-back.md`
- Standings Engine: `docs/Backed_Standings_Engine.md`
- Bracket Engine: `docs/Backend_Bracket_Engine.md`
- Transition Engine: `docs/Backend_Transition_Engine.md`
- Design system: `DESIGN.md`
- Pulido/readiness del Bloque 9: `docs/block-9-polish.md`
- Onboarding/pulido UI del Bloque 10: `docs/block-10-onboarding-and-ui-polish.md`

## Checklist final de QA

Ejecutar solo cuando QA Mode o la validación final estén aprobados.

### Preflight de runtime WSL

```bash
source ~/.nvm/nvm.sh && nvm use 24
which node
which pnpm
type -a node
type -a pnpm
```

El runtime activo esperado debe resolver primero a rutas WSL Linux-native bajo `/home/yorch/.nvm/versions/node/...`.

### Checks automáticos

```bash
pnpm run build
pnpm run lint
pnpm run test
```

Si Vitest usa una ruta temporal de Windows desde WSL, usar variables temporales Linux:

```bash
TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test
```

### Revisión manual

- [ ] `/` Home.
- [ ] `/grupos` Fixture de grupos.
- [ ] `/posiciones` Tabla de posiciones.
- [ ] `/eliminatorias` Eliminatorias.
- [ ] `/predicciones` Predicciones.
- [ ] Responsive mobile/tablet/desktop.
- [ ] Estados de loading.
- [ ] Modal de delayed loading y copy de server wake-up.
- [ ] Estados de error con botones de retry.
- [ ] Estados empty.
- [ ] Textos visibles en español.
- [ ] Sin errores técnicos crudos del backend en UI.
- [ ] Links y comandos del README.
- [ ] Docs de API pública no presentan rutas administrativas como uso del frontend público.

## Pulido opcional futuro de textos

Subtarea opcional pendiente: reemplazar copy técnico visible en el código fuente después del cierre documental.

Reemplazos sugeridos:

- `backend` → `servidor`, `datos de la base de datos` o `información recibida`.
- `API` → `datos recibidos` o `fuente de datos`.
- `skeleton` → `estructura base` o `cuadro base`.
- `placeholders` / `TBD` → `equipos por definir`.
- `PENDING` → `Pendiente`.
- `Portfolio project` → `Proyecto de portfolio`.
- `International football experience` → `Experiencia de fútbol internacional`.
- `Kickoff ready` → `Listo para el inicio`.
- `World football tracker` → `Seguimiento del Mundial`.
