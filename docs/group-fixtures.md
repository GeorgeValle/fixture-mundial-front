# Group Fixtures

## Propósito

La sección Group Fixtures permite consultar los partidos de fase de grupos del Mundial 2026. El usuario elige un grupo A-L y visualiza sus seis partidos ordenados por fecha.

## Ruta

```text
/grupos
```

## Componentes principales

- `GroupFixtures`: página que carga partidos, mantiene el grupo seleccionado y coordina estados.
- `GroupSelector`: selector de grupos A-L.
- `FixtureMatchCard`: card reutilizable para mostrar equipos, escudos, fecha, estadio, marcador y estado.
- `SkeletonList`: loading visual con forma de lista de partidos.
- `FeedbackModal`: aviso global para demoras de carga.

## Servicios y endpoints usados

Servicio:

```text
src/services/matches/matchesService.js
```

Endpoint:

```text
GET /api/matches
```

La respuesta se valida y normaliza con:

```text
src/schemas/matchSchema.js
```

## Reglas de datos

- El frontend consume el fixture completo.
- Luego filtra por:

```text
stage = "GRUPO X"
```

Ejemplo:

```text
GRUPO A
```

- Los partidos se ordenan por fecha.
- El grupo inicial seleccionado es `A`.

## Estados manejados

### Loading

Muestra `SkeletonList` con seis elementos, representando los seis partidos esperados del grupo.

### Delayed loading

Si la carga se demora, se usa `FeedbackModal` para explicar que la información puede tardar unos segundos.

### Error

Si falla el request o el payload no es válido, se muestra un mensaje amigable y no se exponen errores técnicos.

### Empty state

Si el grupo seleccionado no tiene partidos renderizables, se informa que aún no hay partidos para ese grupo.

### Datos válidos

Cuando hay partidos:

- se muestra una tarjeta resumen del grupo;
- se renderiza la lista de partidos;
- cada partido usa `FixtureMatchCard`.

## Decisiones visuales y UX

- El selector de grupo está en el header de la página para facilitar el cambio de contexto.
- La card de partido centraliza marcador, equipos y metadatos.
- Los scores pendientes se muestran como estado amigable, no como `null`.
- Los escudos vienen de URLs del backend; no se guardan banderas/escudos en el repo.

## Reglas de negocio

- La página no inventa partidos.
- La página no recalcula resultados.
- La página solo filtra y ordena datos recibidos.
- Si el marcador registrado no está disponible, se muestra un estado pendiente.

## Validaciones importantes

- `parseMatchesResponse` acepta array directo o wrappers compatibles.
- Payload inválido dispara error amigable.
- Equipos o sedes incompletas deben tener fallback visual.

## Relación con otras partes de la app

- Comparte `GET /api/matches` con `/eliminatorias` y `/predicciones`.
- Comparte `FixtureMatchCard` con Home.
- Predicciones usa los mismos partidos de fase de grupos, pero con estado local y reglas de locking.

## Limitaciones actuales

- No hay filtros por sede, fecha o equipo.
- No hay página de detalle de partido.
- No hay edición de resultados desde el frontend público.

## Mejoras futuras

- Filtro adicional por fecha o equipo.
- Link a una futura página `/partidos`.
- Mejoras visuales coordinadas con `DESIGN.md` si se aprueba una evolución de match cards.

## Resumen de implementación por bloques

- **Bloque 3**: página `/grupos`, selector de grupo, cards de partido, parsing de backend, loading, delayed loading, error, empty state y tests.
- **Validación manual**: bloque aprobado por el usuario desde WSL.
