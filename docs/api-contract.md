# Contrato API público del frontend

Este documento describe únicamente los endpoints públicos que consume actualmente `fixture-mundial-front`.

El objetivo es separar el contrato real de la UI pública de rutas administrativas, internas o futuras del backend.

## Alcance

Incluye endpoints usados hoy por las páginas implementadas:

- Home `/`
- Fixture de grupos `/grupos`
- Tabla de posiciones `/posiciones`
- Eliminatorias `/eliminatorias`
- Predicciones `/predicciones`

No incluye:

- `POST /api/standings/:group`
- `PUT /api/matches/:id`
- rutas administrativas;
- endpoints no usados por la UI actual;
- `GET /api/teams`;
- `GET /api/stadiums`.

Si alguno de esos endpoints se usa en el futuro, debe documentarse como nuevo alcance aprobado.

## Base URL

El frontend usa `VITE_API_BASE_URL` desde variables de entorno.

Ejemplo local:

```env
VITE_API_BASE_URL=http://localhost:3000
```

El cliente Axios vive en:

```text
src/services/api/axiosClient.js
```

## Manejo general de errores

Los servicios convierten errores desconocidos o respuestas inválidas en mensajes amigables para la UI.

Reglas:

- No mostrar errores técnicos crudos al usuario.
- Registrar detalles útiles mediante el flujo centralizado de errores.
- Usar estados visuales claros: loading, delayed loading, error, empty state y datos válidos.

## `GET /api/matches`

Devuelve el fixture disponible.

### Secciones que lo consumen

- `/grupos`
- `/eliminatorias`
- `/predicciones`

### Servicio frontend

```text
src/services/matches/matchesService.js
```

Función:

```js
getMatches()
```

### Datos esperados

El frontend acepta un array de partidos o un wrapper que contenga el array en campos compatibles como `data` o `matches`.

Campos relevantes por partido:

- `_id`
- `homeTeam`
- `awayTeam`
- `stadium`
- `date`
- `stage`
- `status`
- `homeScore`
- `awayScore`
- `homePenaltyScore`
- `awayPenaltyScore`
- `matchNumber`
- `placeholderHome`
- `placeholderAway`
- `nextMatchWinner`
- `nextMatchLoser`

Campos relevantes de equipo:

- `_id`
- `name`
- `shieldUrl`
- `group`
- `confederation`
- `position`
- `qualifiedTo`

Campos relevantes de estadio:

- `_id`
- `name`
- `country`
- `city`
- `address`
- `capacity`

### Uso por sección

#### `/grupos`

- Filtra partidos por `stage = "GRUPO X"`.
- Ordena partidos por fecha.
- Renderiza escudos, equipos, fecha, estadio, marcador y estado.

#### `/eliminatorias`

- Utiliza el campo `matchNumber` para identificar inequívocamente cada partido de eliminatoria (del 73 al 104).
- Combina datos reales devueltos por la API con el cuadro base documentado, basándose en el `matchNumber`.
- Prioriza datos reales sobre placeholders (`placeholderHome` / `placeholderAway`).
- No inventa equipos, resultados ni clasificados; confía ciegamente en el backend como fuente de verdad.

#### `/predicciones`

- Lee partidos reales, equipos, fechas, estados y resultados registrados.
- Usa `status` y `date` para bloquear predicciones.
- Calcula scoring solo cuando hay resultado final registrado suficiente.
- Mantiene predicciones del usuario en `localStorage`, no en backend.

### Estados UI relacionados

- Loading con skeletons.
- Delayed loading con `FeedbackModal`.
- Error amigable si falla la carga o el payload no se puede interpretar.
- Empty state cuando no hay partidos aplicables a la sección.
- Datos válidos cuando existen partidos renderizables.

## `GET /api/matches/schedule/daily?date=YYYY-MM-DD`

Devuelve la agenda diaria o la próxima fecha disponible.

### Sección que lo consume

- Home `/`

### Servicio frontend

```text
src/services/matches/matchesService.js
```

Función:

```js
getDailySchedule(date)
```

### Query param

- `date`: fecha en formato `YYYY-MM-DD`.

### Datos esperados

```js
{
  today: Match[],
  next: Match[],
  nextDate: string | null
}
```

### Uso actual

Home consulta la fecha actual calculada por el frontend.

Reglas:

- Si `today` tiene partidos, muestra partidos de hoy.
- Si `today` está vacío y `next` tiene partidos, muestra la próxima fecha disponible.
- Si `today` y `next` están vacíos, muestra calendario sin actividad.
- `nextDate` se presenta con formato amigable en español.

### Estados UI relacionados

- Loading con `SkeletonList`.
- Delayed loading con `FeedbackModal`.
- Error amigable.
- Empty state si no hay actividad.
- Datos válidos con hasta ocho partidos visibles.

## `GET /api/standings`

Devuelve tablas de posiciones calculadas por el backend.

### Sección que lo consume

- `/posiciones`

### Servicio frontend

```text
src/services/standings/standingsService.js
```

Función:

```js
getStandings()
```

### Datos esperados

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

### Uso actual

- El frontend consume standings ya calculados.
- El frontend no recalcula posiciones desde partidos.
- El orden recibido desde el backend se preserva.
- Si `qualifiedTo` o `position` no tienen datos registrados, la UI no inventa estados de clasificación.

### Estados UI relacionados

- Loading con skeletons.
- Delayed loading con `FeedbackModal`.
- Error API amigable.
- Error de payload inválido amigable.
- Empty state.
- Datos válidos con tablas por grupo.

## Endpoints fuera del alcance público actual

Los siguientes endpoints no forman parte del uso público actual del frontend:

- `POST /api/standings/:group`
- `PUT /api/matches/:id`
- `GET /api/teams`
- `GET /api/stadiums`
- `POST /api/admin/classify-group` (Uso exclusivo del panel administrativo)

Pueden existir en el backend, pero no deben presentarse como contrato público de la UI actual.

## Relación con documentación por página

- Home: `docs/home.md`
- Fixture por grupos: `docs/group-fixtures.md`
- Tabla de posiciones: `docs/group-standings.md`
- Eliminatorias: `docs/knockout-stage.md`
- Predicciones: `docs/prediction-fixture.md`
