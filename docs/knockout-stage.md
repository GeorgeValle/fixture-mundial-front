# Knockout Stage

## Propósito

La sección Knockout Stage muestra la fase eliminatoria del Mundial 2026 desde dieciseisavos de final hasta la final. Su objetivo es presentar el camino hacia el título sin inventar clasificados, resultados ni progresiones que todavía no estén confirmadas por datos de la base de datos.

## Ruta

```text
/eliminatorias
```

## Componentes principales

- `KnockoutStage`: página responsable de cargar partidos, combinar datos, manejar filtro de ronda y alternar vista de partidos/llaves.
- `KnockoutBracket`: renderiza la vista actual de partidos agrupados por ronda.
- `KnockoutBracketView`: renderiza la vista compacta horizontal de llaves con el cuadro completo.
- `KnockoutRound`: renderiza una ronda y sus partidos.
- `KnockoutMatchCard`: muestra partido, fecha, estadio, equipos/placeholders, marcador, penales y estado.
- `SkeletonList`: loading visual.
- `FeedbackModal`: feedback para delayed loading.

## Servicios, datos y endpoints usados

Endpoint público:

```text
GET /api/matches
```

Servicio:

```text
src/services/matches/matchesService.js
```

Skeleton documentado:

```text
docs/knockout-stage-skeleton.md
src/data/knockoutStageSkeleton.js
```

Adapter:

```text
src/utils/knockoutStageAdapter.js
```

## Fuente de datos

La sección usa dos fuentes:

1. Datos reales desde `GET /api/matches`.
2. Cuadro base documentado para completar la estructura visual cuando aún falta información recibida desde el backend.

Prioridad:

1. Backend/base de datos.
2. Cuadro base documentado.
3. Placeholders claros.

## Merge backend + cuadro base

El merge se realiza en `buildKnockoutStageMatches`.

Estrategias de identificación:

- `matchNumber`, si el backend lo provee.
- `templateCode`, si el backend lo provee.
- clave compuesta normalizada por ronda, fecha y estadio solo cuando no hay identidad explícita y el match no es ambiguo.

Reglas:

- Datos reales tienen prioridad.
- El cuadro base completa campos de presentación.
- Scores y penales solo se muestran si vienen del backend.
- Ganador registrado solo se deriva con resultado completo y `status === 'FINISHED'`.
- No se avanzan equipos a rondas futuras desde el frontend.

## Estados manejados

### Loading

Muestra skeletons mientras se consulta `GET /api/matches`.

### Delayed loading

Si la carga demora, se informa que se está preparando el cuadro base.

### Error

Si falla la consulta, se muestra el cuadro base documentado con mensaje amigable.

### Empty / datos de la base de datos pendientes

Si no hay datos reales de eliminatorias, la UI muestra la estructura documentada con equipos por definir.

### Datos parciales

Si algunos partidos tienen datos reales y otros no, se informa cuántos partidos tienen datos de la base de datos y cuántos siguen pendientes.

### Datos válidos

Cuando hay datos reales:

- se reemplazan equipos reales;
- se muestran marcadores registrados si existen;
- se muestran penales si existen;
- se muestra ganador registrado solo si se puede derivar de forma segura.

## Decisiones visuales y UX

- La página incluye un selector de vista:
  - Vista de partidos: conserva los filtros por ronda y las cards existentes.
  - Vista de llaves: muestra el cuadro completo como bracket compacto horizontal, con nodos de dos filas, final centrada como convergencia entre semifinales y scroll horizontal en mobile si hace falta.
- La página incluye filtro por ronda solo en la vista de partidos:
  - Todas las rondas.
  - Dieciseisavos de final.
  - Octavos de final.
  - Cuartos de final.
  - Semifinales.
  - Partido por el tercer puesto.
  - Final.
- Los labels visibles deben estar en español.
- Los placeholders deben verse como datos pendientes, no como equipos confirmados.
- La vista de llaves marca slots como ganador, eliminado, pendiente o por definir sin mostrar badges, fechas, estadios ni números de partido dentro del nodo compacto.
- Ganador/perdedor se derivan solo dentro del partido finalizado con resultado completo; en empates se contemplan penales.
- La UI distingue datos de la base de datos de estructura base.

## Reglas de negocio

- No inventar equipos clasificados.
- No inventar resultados.
- No inventar penales.
- No simular progresión de bracket en frontend: los futuros cruces muestran equipos reales solo si el backend ya los devolvió persistidos en ese partido.
- No mover ganadores/perdedores a futuros partidos si el backend no lo confirma.
- No mostrar keys técnicas como `round-of-32`, `templateCode` o `roundKey` en UI.

## Validaciones importantes

- El adapter rechaza matches ambiguos.
- Solo usa compound matching cuando es seguro.
- El ganador registrado requiere datos completos.
- Empates en eliminatorias requieren penales completos para derivar ganador.

## Relación con otras partes de la app

- Comparte `GET /api/matches` con `/grupos` y `/predicciones`.
- El estado de eliminatorias condiciona cuándo podría habilitarse predicción de cruces reales.
- Usa el mismo sistema de delayed loading y feedback que otras páginas.

## Limitaciones actuales

- El frontend renderiza una vista visual de llaves, pero no simula avance de equipos.
- Las predicciones de eliminatorias siguen cerradas en `/predicciones`.
- La estructura base depende del documento `docs/knockout-stage-skeleton.md`.
- Si el backend no provee identidad explícita de partidos, el merge depende de una clave compuesta conservadora.

## Mejoras futuras

- Backend con `matchNumber`, `templateCode`, `roundKey`, `winnerGoesTo` y `loserGoesTo`.
- Progresión basada en datos confirmados del backend.
- Diseño de match cards con estética más cercana a campo de juego, si se aprueba.
- Mayor detalle para explicar origen de datos por partido.

## Archivos relacionados

- `docs/knockout-stage-skeleton.md`
- `src/data/knockoutStageSkeleton.js`
- `src/utils/knockoutStageAdapter.js`
- `src/components/KnockoutBracket/KnockoutBracket.jsx`
- `src/components/KnockoutRound/KnockoutRound.jsx`
- `src/components/KnockoutMatchCard/KnockoutMatchCard.jsx`
- `src/components/KnockoutBracketView/KnockoutBracketView.jsx`
- `src/pages/KnockoutStage/KnockoutStage.jsx`

## Resumen de implementación por bloques

- **Bloque 6**: skeleton local, adapter de merge, página `/eliminatorias`, filtro de rondas, bracket, cards, estados de UI y tests.
- **Bloque 18**: toggle de vista partidos/llaves, vista compacta horizontal de llaves, final centrada, estados visuales ganador/eliminado/pendiente/por definir y tests.
- **Validación**: build, lint y test pasaron durante el cierre del Bloque 6.
- **Validación Bloque 18**: `pnpm run lint`, `pnpm run test` (39 archivos, 381 tests) y `pnpm run build` pasaron; build informó la advertencia conocida de chunk mayor a 500 kB.
- **Validación manual**: bloque aprobado por el usuario.
