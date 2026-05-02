# Documentación pública del Backend — Fixture Mundial 2026

Este documento describe el contrato público que consume el frontend `fixture-mundial-front`.

Su objetivo es servir como fuente de verdad para renderizar partidos, leer resultados oficiales, bloquear predicciones y calcular scoring en el frontend.

## Alcance público

El frontend público consume datos oficiales desde el backend y guarda las predicciones del usuario en `localStorage`.

Este documento **no** documenta rutas administrativas, rutas internas ni operaciones de escritura del backend.

Aunque existan en el backend, esas rutas no forman parte del contrato público del frontend para Prediction Fixture.

## Arquitectura y stack del backend

- Arquitectura: N-Capas (`Routes -> Controllers -> Services -> DAOs -> Models`).
- Runtime: Node.js con ES Modules.
- Base de datos: MongoDB con Mongoose.
- Validación: Zod.
- Persistencia: DAO / Factory Pattern para desacoplar la lógica de la base de datos.

## Modelos públicos relevantes

### Team

Representa a una selección nacional y su estado de avance en el torneo.

Campos relevantes para el frontend:

- `_id`: identificador del equipo.
- `name`: nombre visible de la selección.
- `shieldUrl`: URL del escudo/bandera usada por la UI.
- `group`: grupo de fase inicial, por ejemplo `A`, `B`, `C`.
- `confederation`: confederación del equipo.
- `position`: posición en el grupo cuando existe.
- `qualifiedTo`: dato técnico de avance/eliminación.
- `createdAt`: fecha de creación del registro.
- `updatedAt`: fecha de última actualización del registro.

#### `Team.qualifiedTo`

`qualifiedTo` indica a qué instancia avanza un equipo o si quedó eliminado.

Valores técnicos recomendados para backend/frontend:

- `ROUND_OF_32`
- `ROUND_OF_16`
- `QUARTER_FINALS`
- `SEMI_FINALS`
- `THIRD_PLACE_MATCH`
- `FINAL`
- `ELIMINATED`
- `null`

Reglas:

- `null` no debe ser un string dentro del enum.
- `null` representa estado pendiente o sin definición.
- `ELIMINATED` representa eliminación confirmada.
- El frontend solo lee `qualifiedTo`; no lo modifica.
- El frontend debe mapear `qualifiedTo` a labels visibles en español.

Ejemplos de labels visibles:

| Valor técnico | Label visible |
| --- | --- |
| `ROUND_OF_32` | `Dieciseisavos de final` |
| `ROUND_OF_16` | `Octavos de final` |
| `QUARTER_FINALS` | `Cuartos de final` |
| `SEMI_FINALS` | `Semifinales` |
| `THIRD_PLACE_MATCH` | `Partido por el tercer puesto` |
| `FINAL` | `Final` |
| `ELIMINATED` | `Eliminado` |
| `null` | Sin definición oficial |

Nota técnica:

- Si el backend actual todavía devuelve valores como `Round of 32`, `Quarter-finals` o `Third-place match`, el frontend debe normalizarlos temporalmente hasta que la API devuelva valores técnicos consistentes.
- Si el modelo backend usa `uppercase: true`, el enum debería usar valores uppercase compatibles, por ejemplo `ROUND_OF_32`, para evitar inconsistencias entre validación, persistencia y respuesta de API.

### Stadium

Campos relevantes para el frontend:

- `_id`: identificador del estadio.
- `name`: nombre del estadio.
- `country`: país sede.
- `city`: ciudad sede.
- `capacity`: capacidad.
- `address`: dirección, si existe.
- `createdAt`: fecha de creación del registro.
- `updatedAt`: fecha de última actualización del registro.

### Match

Representa un partido oficial del fixture.

Campos relevantes para el frontend:

- `_id`: identificador del partido.
- `homeTeam`: equipo local; puede venir populado como objeto `Team` o como referencia.
- `awayTeam`: equipo visitante; puede venir populado como objeto `Team` o como referencia.
- `stadium`: estadio; puede venir populado como objeto `Stadium` o como referencia.
- `date`: fecha/hora de inicio del partido.
- `stage`: fase, grupo o instancia del torneo.
- `status`: estado del partido.
- `homeScore`: marcador regular oficial del equipo local.
- `awayScore`: marcador regular oficial del equipo visitante.
- `homePenaltyScore`: goles de penales del equipo local, si aplica.
- `awayPenaltyScore`: goles de penales del equipo visitante, si aplica.
- `createdAt`: fecha de creación del registro.
- `updatedAt`: fecha de última actualización del registro.

Aclaraciones:

- `homeTeam`, `awayTeam` y `stadium` pueden venir populados o como referencias, según la respuesta del backend.
- `date` representa la fecha/hora de inicio del partido y se usa para bloquear predicciones.
- `stage` identifica grupo o fase, por ejemplo fase de grupos o eliminatorias.
- `status` puede ser `PENDING`, `PLAYING` o `FINISHED`.
- `homeScore` y `awayScore` representan el marcador regular oficial.
- `homePenaltyScore` y `awayPenaltyScore` aplican en eliminatorias cuando el partido se define por penales.
- Los scores pueden ser `null` si el resultado oficial todavía no existe.

## Rutas públicas de partidos

El frontend público debe documentar y consumir solo estas rutas de lectura para partidos.

### `GET /api/matches`

Devuelve el fixture completo ordenado por fecha.

Uso frontend:

- renderizar partidos;
- listar partidos de fase de grupos para predicciones;
- detectar partidos de eliminatorias reales cuando existan;
- leer `status`, `date` y resultados oficiales;
- recalcular scoring cuando cambien resultados oficiales.

Respuesta esperada:

- Array de `Match`, o un wrapper que contenga el array en `data` o `matches`.

### `GET /api/matches/schedule/daily?date=YYYY-MM-DD`

Devuelve el calendario diario inteligente.

Uso frontend:

- Home Daily Schedule.

Respuesta esperada:

- `today`: partidos de la fecha consultada.
- `next`: partidos del próximo día con actividad.
- `nextDate`: fecha ISO del próximo día con actividad.

Nota técnica de routing Express:

- La ruta `/schedule/daily` debe declararse antes de `/:id` para evitar que `schedule` sea interpretado como parámetro dinámico.

### `GET /api/matches/:id`

Devuelve el detalle de un partido por ID.

Uso frontend:

- consultar detalle puntual de un partido si una vista o flujo lo requiere;
- leer resultado oficial actualizado de un partido específico;
- confirmar estado y datos oficiales antes de scoring puntual.

Respuesta esperada:

- Un objeto `Match`, o un wrapper con el objeto en `data`.

## Match status y locking de predicciones

Prediction Fixture debe usar `status` y `date` para bloquear edición.

### `PENDING`

- El partido todavía no empezó.
- La predicción es editable solo si la fecha/hora actual es anterior a `date`.

### `PLAYING`

- El partido ya empezó.
- La predicción debe estar bloqueada.

### `FINISHED`

- El partido terminó.
- La predicción debe estar bloqueada.
- Se puede calcular scoring si hay resultado oficial suficiente.

Regla adicional:

- Si `now >= match.date`, la predicción debe bloquearse aunque `status` siga siendo `PENDING`.

## Resultado oficial

El resultado oficial se lee desde:

- `homeScore`
- `awayScore`
- `homePenaltyScore`
- `awayPenaltyScore`

Reglas:

- No calcular scoring si faltan datos oficiales suficientes.
- `homeScore` y `awayScore` son necesarios para cualquier scoring basado en resultado regular.
- En eliminatorias, si el resultado regular está empatado, se necesitan `homePenaltyScore` y `awayPenaltyScore` para determinar el clasificado.

## Ganador oficial en eliminatorias

Para eliminatorias, el frontend debe derivar el ganador principalmente desde el resultado oficial del `Match`.

Lógica:

- Si `homeScore > awayScore`, gana `homeTeam`.
- Si `awayScore > homeScore`, gana `awayTeam`.
- Si `homeScore === awayScore`, el partido se define por penales.
- Si `homePenaltyScore > awayPenaltyScore`, gana `homeTeam`.
- Si `awayPenaltyScore > homePenaltyScore`, gana `awayTeam`.

No calcular ganador oficial si:

- `status !== FINISHED`;
- falta `homeScore`;
- falta `awayScore`;
- hay empate regular y falta `homePenaltyScore`;
- hay empate regular y falta `awayPenaltyScore`;
- hay empate regular y los penales también empatan;
- los datos oficiales son inconsistentes.

## Relación con `Team.qualifiedTo`

`qualifiedTo` es un dato complementario de avance/eliminación.

Reglas esperadas:

- El equipo que gana una eliminatoria debería avanzar a otra ronda mediante `qualifiedTo`.
- En la mayoría de rondas, el perdedor debería quedar con `qualifiedTo: ELIMINATED`.
- En semifinales, el perdedor puede tener `qualifiedTo: THIRD_PLACE_MATCH`.
- El frontend no debe modificar `qualifiedTo`.
- Para scoring, el frontend debe derivar el ganador principalmente desde el resultado oficial del `Match`.
- `qualifiedTo` puede usarse como dato complementario para visualizar avance/eliminación o detectar inconsistencias.

## Scoring de fase de grupos

Reglas actuales para Prediction Fixture:

- 1 punto por acertar ganador.
- 2 puntos por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.
- 1 punto por acertar empate.
- 1 punto por acertar cantidad exacta de goles del empate.
- El scoring se recalcula si cambia el resultado oficial del backend.

No calcular scoring si el partido no está terminado o faltan datos oficiales suficientes.

## Scoring de eliminatorias

Prediction Fixture debe distinguir partidos definidos en marcador regular y partidos empatados en goles definidos por penales.

### Partido definido en marcador regular

- 2 puntos por acertar ganador/clasificado.
- 1 punto por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.

### Partido empatado en goles y definido por penales

- 2 puntos por acertar ganador/clasificado.
- 1 punto por acertar que el partido terminó empatado en goles.
- 1 punto por acertar la cantidad exacta de goles del empate.
- 1 punto por acertar goles de penales del ganador.
- 1 punto por acertar goles de penales del perdedor.

Reglas de validación de predicciones de eliminatorias:

- Si el usuario predice empate regular en eliminatorias, debe completar penales.
- Si los penales predichos también empatan, la predicción es inválida.
- Si faltan penales en una predicción empatada de eliminatorias, la predicción es inválida.
- No permitir predicciones de eliminatorias sobre placeholders.
- La zona de predicciones de eliminatorias se habilita solo cuando el backend tenga cruces reales con equipos definidos.

## UI/UX para Prediction Fixture

Dependencias de backend:

- El backend provee partidos, estados y resultados oficiales.
- Las predicciones del usuario se guardan en `localStorage`, no en backend.

Cuando un partido termina, la UI debe mostrar:

- predicción del usuario;
- resultado oficial;
- puntos obtenidos;
- indicadores de acierto;
- penales si existieron.

Indicadores esperados:

- `Ganador acertado`
- `Clasificado acertado`
- `Empate acertado`
- `Goles del ganador acertados`
- `Goles del perdedor acertados`
- `Goles del empate acertados`
- `Penales del ganador acertados`
- `Penales del perdedor acertados`

Los indicadores no deben depender solo del color; deben tener texto visible.

## Notas para frontend

- Usar `axiosClient` para consumir rutas públicas.
- No hardcodear URLs productivas en servicios; usar configuración de entorno cuando corresponda.
- No mostrar errores técnicos crudos al usuario.
- Normalizar respuestas si el backend devuelve arrays directos o wrappers con `data` / `matches`.
- Normalizar `qualifiedTo` temporalmente si la API devuelve valores legacy o con casing inconsistente.
