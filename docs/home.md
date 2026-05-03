# Home

## Propósito

Home es la página de entrada de `fixture-mundial-front`. Presenta el proyecto, resume las secciones principales y muestra una agenda del torneo con partidos de hoy o, si no hay actividad, la próxima fecha disponible.

## Ruta

```text
/
```

## Componentes principales

- `Home`: página principal, carga la agenda diaria y organiza el hero + secciones informativas.
- `DailyScheduleCard`: decide si mostrar partidos de hoy, próxima jornada o estado vacío.
- `FixtureMatchCard`: renderiza cada partido visible.
- `SkeletonList`: muestra placeholders durante la carga.
- `FeedbackModal`: informa demoras o errores de forma amigable mediante estado global.

## Servicios y endpoints usados

Servicio:

```text
src/services/matches/matchesService.js
```

Endpoint:

```text
GET /api/matches/schedule/daily?date=YYYY-MM-DD
```

Home calcula la fecha actual con utilidades del frontend y consulta el calendario diario.

## Estados manejados

### Loading

Mientras se consulta la agenda, la página muestra skeletons dentro de `DailyScheduleCard`.

### Delayed loading

Si la respuesta demora más que el umbral definido en `DELAYED_LOADING_THRESHOLD_MS`, se abre un `FeedbackModal` con mensaje amigable.

### Error

Si falla la carga o la respuesta no se puede interpretar, se muestra un estado de error sin exponer detalles técnicos.

### Empty state

Si `today` y `next` llegan vacíos, se muestra un calendario sin actividad.

### Datos válidos

Reglas de render:

- Si `today.length > 0`, mostrar `Partidos de hoy`.
- Si `today.length === 0` y `next.length > 0`, mostrar `Próxima fecha disponible`.
- Si `nextDate` existe, formatearlo en español antes de mostrarlo.

## Decisiones visuales y UX

- El hero presenta la app como experiencia de fixture, tablas, eliminatorias y predicciones.
- La agenda diaria aparece debajo del hero y antes de las tarjetas informativas.
- Se muestran hasta ocho partidos para mantener la portada legible.
- Las fechas visibles deben ser amigables en español y no exponer valores ISO crudos.

## Reglas de negocio

- Home no hace requests extra a equipos ni estadios.
- La agenda diaria depende solo del endpoint público de calendario diario.
- El backend es fuente de partidos; el frontend solo decide qué bloque mostrar.

## Validaciones importantes

- `nextDate` inválido o ausente no debe renderizar `Invalid Date`, `null`, `undefined` ni valores técnicos.
- Payload inválido debe terminar en estado amigable de error.
- La fecha `2026-06-11T00:00:00.000Z`, si aparece, debe mostrarse como 11 de junio sin corrimiento por zona horaria.

## Relación con otras partes de la app

- Reutiliza `FixtureMatchCard`, igual que `/grupos`.
- Comparte servicio de partidos con `/grupos`, `/eliminatorias` y `/predicciones`.
- Usa el sistema global de feedback compartido.

## Limitaciones actuales

- Home no permite navegar por fechas manualmente.
- No muestra calendario completo.
- No consulta equipos ni estadios por separado.

## Mejoras futuras

- Selector de fecha.
- Enlace directo desde cada partido hacia una futura página de detalle.
- Filtros por sede o grupo si el alcance del producto crece.

## Resumen de implementación por bloques

- **Bloque 4**: integración del calendario diario, fallback a próxima fecha, loading, delayed loading, error y empty state.
- **Follow-up Bloque 4**: formato amigable de `nextDate` en español.
