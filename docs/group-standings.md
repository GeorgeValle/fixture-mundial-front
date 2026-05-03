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
```

Endpoint público:

```text
GET /api/standings
```

Schema:

```text
src/schemas/standingsSchema.js
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
- Los badges de clasificación solo deben mostrarse si el backend trae datos útiles.

## Reglas de negocio

- No inventar posiciones registradas.
- No inventar etiquetas de clasificación si `team.qualifiedTo` está vacío o `null`.
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
