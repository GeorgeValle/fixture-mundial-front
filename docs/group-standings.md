# Group Standings

## Propósito

La sección Group Standings muestra las tablas de posiciones de los grupos A-L. El frontend consume standings calculados por el backend y los presenta en cards compactas y legibles.

## Ruta

```text
/posiciones
```

## Componentes principales

- `GroupStandings`: página responsable de cargar standings, manejar estados y controlar modo de vista.
- `StandingsGroupCard`: card visual por grupo.
- `StandingsTable`: tabla semántica con estadísticas.
- `SkeletonList`: loading visual.
- `FeedbackModal`: aviso global para demoras de carga.

## Servicios y endpoints usados

Servicio:

```text
src/services/standings/standingsService.js
src/services/matches/matchesService.js
```

Endpoint público:

```text
GET /api/standings
GET /api/matches
```

Schema:

```text
src/schemas/standingsSchema.js
src/schemas/matchSchema.js
```

## Contrato público de datos

Respuesta esperada:

```js
{
  status: 'success',
  data: [
    {
      group: 'A',
      teams: [
        {
          team: {
            _id: '...',
            name: '...',
            shieldUrl: '...',
            group: 'A',
            confederation: '...',
            position: null,
            qualifiedTo: null
          },
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dif: 0,
          pts: 0
        }
      ]
    }
  ]
}
```

## Regla clave

El frontend no recalcula standings desde partidos.

La fuente de verdad para posiciones es:

```text
GET /api/standings
```

El orden de grupos y equipos recibido se preserva.

## Estados manejados

### Loading

Muestra skeletons con forma de tarjetas/listas.

### Delayed loading

Si la carga demora, se muestra `FeedbackModal` explicando que las posiciones pueden tardar unos segundos.

### Error API

Si falla el request, la página muestra un mensaje amigable.

### Payload inválido

Si la respuesta no cumple el contrato esperado, se muestra un error amigable distinto al error de red.

### Empty state

Si no hay standings renderizables, se informa que aún no hay tablas disponibles.

### Datos válidos

Cuando hay standings:

- se renderiza vista general o vista foco;
- cada grupo muestra tabla de posiciones;
- se muestran escudos cuando existen;
- se usa fallback visual si falta `shieldUrl`.

## Decisiones visuales y UX

- La página soporta dos modos:
  - `Vista general`: todos los grupos en grid.
  - `Vista foco`: un grupo seleccionado con card protagonista.
- El selector de grupo de `Vista foco` se construye desde los grupos devueltos por el backend.
- Los botones de modo usan `aria-pressed`.
- Los headers de cards tienen acentos visuales y watermarks decorativos.
- Los badges de clasificación de cada grupo muestran el resultado histórico de la fase de grupos, no el estado actual del torneo.
- Los badges de terceros usan la misma base que la tabla de mejores terceros: el ranking derivado desde `GET /api/standings`.
- La carga de posiciones depende solo de `GET /api/standings`; `GET /api/matches` no es necesario para decidir los badges históricos.

## Reglas de negocio

- No inventar posiciones registradas.
- No usar `team.qualifiedTo` como fuente principal para badges históricos de grupo, porque puede representar el estado actual del torneo después de eliminatorias.
- Los equipos en posición 1 y 2 muestran `Clasificado a 16avos` solo cuando el grupo está completo (`teams.length === 4` y todos los rows tienen `pj === 3`).
- Los equipos en posición 3 muestran `Clasificado a 16avos` solo si el ranking confiable de mejores terceros los ubica dentro del top 8.
- El ranking de mejores terceros es confiable solo cuando existen los 12 grupos completos, cada grupo tiene 4 equipos, todos tienen `pj === 3` y hay un tercero oficial con `team.position === 3` por grupo.
- Si el ranking de mejores terceros no es confiable, los terceros quedan `Pendiente`; no se los marca como eliminados por contexto de bracket o partidos incompletos.
- Los equipos en posición 4 muestran `Eliminado en grupos` solo cuando el grupo está completo.
- Si `team.position` es `null`, la UI puede mostrar posición visual por orden de fila, pero no tratarla como dato confirmado.
- Las columnas visibles son: Pos, Equipo, PJ, PG, PE, PP, GF, GC, DIF, PTS.

## Validaciones importantes

- `status` debe ser `success`.
- `data` debe ser array.
- Cada grupo debe tener `group` y `teams`.
- Cada row debe contener estadísticas numéricas.

## Nota sobre endpoints administrativos

El backend puede tener endpoints de mantenimiento para recalcular standings, pero no forman parte del contrato público de esta UI.

La página pública `/posiciones` no debe llamar endpoints que modifiquen estado del backend.

## Relación con otras partes de la app

- Comparte sistema global de loading y feedback.
- Usa reglas visuales de `DESIGN.md`.
- Complementa `/grupos`, porque muestra posiciones calculadas a partir de resultados registrados.

## Limitaciones actuales

- No recalcula tablas offline.
- No permite refrescar manualmente un grupo.
- No muestra explicación detallada de desempates.

## Mejoras futuras

- Leyenda de clasificación cuando el backend confirme `qualifiedTo`.
- Explicación visual de criterios de desempate.
- Filtro por grupo persistente si se decide conservar estado entre visitas.

## Resumen de implementación por bloques

- **Bloque 5**: integración de `GET /api/standings`, página `/posiciones`, cards, tablas, loading, delayed loading, error, empty state, payload inválido y tests.
- **Follow-up visual**: vista general/vista foco, cards refinadas y watermarks decorativos.
- **Validación manual**: bloque aprobado por el usuario antes de iniciar Bloque 6.
