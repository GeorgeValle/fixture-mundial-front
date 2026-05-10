# 🏆 API Backend Mundial 2026 — Contrato, modelos y motores

Este documento fusiona la documentación pública anterior de `API-Backend-Mundial-2026.md` con la versión más actualizada de `api-back.md`.

La versión base priorizada es `api-back.md`, porque refleja los cambios más recientes del backend: rutas administrativas bajo `/api/admin`, motores `Standings`, `Transition` y `Bracket`, valores técnicos nuevos para `qualifiedTo` y la separación entre lectura pública y acciones privadas.

---

## 1. Objetivo del documento

Este documento sirve como fuente de verdad para entender:

- qué datos expone el backend al frontend público;
- qué rutas consume la UI pública;
- qué rutas privadas puede usar el panel de administración;
- cómo se calculan posiciones de grupos;
- cómo se siembran clasificados en 16avos;
- cómo avanzan los equipos en eliminatorias;
- qué datos necesita el frontend para renderizar fixture, standings, eliminatorias y predicciones.

---

## 2. Filosofía arquitectónica

El backend está organizado con una arquitectura por capas:

```txt
Routes -> Controllers -> Services -> DAOs -> Models
```

Principios principales:

- **Separación de responsabilidades:** los controladores no contienen reglas complejas de torneo.
- **DAOs:** la lógica de negocio queda desacoplada de Mongoose.
- **Servicios:** los engines de torneo viven en servicios especializados.
- **Validación estricta:** Zod valida payloads antes de llegar a servicios.
- **Persistencia desacoplada:** el acceso a MongoDB se canaliza mediante DAOs / Factory Pattern.
- **Automatización controlada:** la asignación de clasificados y progresión de llaves se realiza mediante motores internos.

Motores principales:

```txt
Standings Engine   -> calcula posiciones de grupos
Transition Engine  -> siembra clasificados de grupos en 16avos
Bracket Engine     -> progresa ganadores/perdedores en eliminatorias
```

---

## 3. Alcance público vs alcance privado

### 3.1 Alcance público

El frontend público consume datos oficiales del backend para:

- renderizar Home;
- renderizar fixture por grupos;
- renderizar standings;
- renderizar eliminatorias;
- bloquear predicciones;
- calcular scoring de predicciones;
- mostrar resultados oficiales.

Las predicciones del usuario se guardan en `localStorage`, no en backend.

### 3.2 Alcance privado

Las rutas privadas son para el panel de administración y requieren autenticación de administrador.

Estas rutas permiten:

- cargar resultados;
- cambiar estado de partidos;
- cargar penales;
- recalcular posiciones;
- sembrar clasificados;
- corregir equipos en casos excepcionales;
- disparar progresiones de bracket mediante triggers internos.

---

## 4. Autenticación administrativa

Las rutas privadas bajo `/api/admin` requieren un token válido de administrador, gestionado por `authMiddleware`.

La implementación recomendada para el frontend es usar cookie `HttpOnly` para el JWT administrativo.

### Login

```http
POST /api/auth/login
```

Payload:

```json
{
  "email": "admin@mundial.com",
  "password": "TuPasswordSecreto123"
}
```

Respuesta esperada:

```json
{
  "status": "success",
  "data": {
    "email": "admin@mundial.com",
    "role": "ADMIN"
  }
}
```

El token no debe exponerse al frontend. El servidor debe enviarlo mediante `Set-Cookie`.

### Logout

```http
POST /api/auth/logout
```

El frontend debe limpiar su estado local después de llamar al backend.

### Restauración de sesión recomendada

```http
GET /api/auth/me
```

Uso recomendado:

- restaurar sesión al recargar la app;
- validar si la cookie sigue vigente;
- redirigir a login si responde `401`.

---

## 5. Modelos principales

## 5.1 Team

Representa a una selección nacional participante.

### Campos relevantes

```txt
_id: ObjectId
name: String
shieldUrl: String
group: String
position: Number | null
qualifiedTo: String | null
createdAt: Date
updatedAt: Date
```

### `shieldUrl`

El campo canónico usado por el backend y el frontend es:

```txt
shieldUrl
```

Representa la URL del escudo o bandera usada por la UI.

### `qualifiedTo`

`qualifiedTo` indica la instancia alcanzada por el equipo o su eliminación.

Valores técnicos actuales:

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

Reglas:

- `null` representa estado pendiente o sin definición.
- `ELIMINATED` representa eliminación confirmada.
- El frontend público solo lee este dato.
- El panel admin puede corregirlo manualmente en casos excepcionales.
- El frontend debe traducirlo a labels visibles en español.

Labels recomendados:

| Valor técnico | Label visible |
| --- | --- |
| `ROUND_OF_32` | Dieciseisavos de final |
| `ROUND_OF_16` | Octavos de final |
| `QUARTER_FINALS` | Cuartos de final |
| `SEMI_FINALS` | Semifinales |
| `THIRD_PLACE_MATCH` | Partido por el tercer puesto |
| `FINAL` | Final |
| `ELIMINATED` | Eliminado |
| `null` | Sin definición oficial |

---

## 5.2 Match

Representa un partido de fase de grupos o eliminatorias.

### Campos relevantes

```txt
_id: ObjectId
homeTeam: ObjectId | Team | null
awayTeam: ObjectId | Team | null
date: Date
stadium: String | Stadium
stage: String
status: String
homeScore: Number | null
awayScore: Number | null
homePenaltyScore: Number | null
awayPenaltyScore: Number | null
createdAt: Date
updatedAt: Date
```

### Campos exclusivos del Bracket Engine

```txt
matchNumber: Number
placeholderHome: String
placeholderAway: String
nextMatchWinner: Number | null
nextMatchLoser: Number | null
```

Reglas:

- `matchNumber` identifica de forma fuerte partidos de eliminatorias.
- Los partidos de eliminatorias usan numeración del `73` al `104`.
- `placeholderHome` y `placeholderAway` indican el slot esperado mientras no haya equipo real.
- `nextMatchWinner` apunta al partido donde debe avanzar el ganador.
- `nextMatchLoser` se usa principalmente en semifinales para enviar perdedores al tercer puesto.

### Status de partido

Valores actuales:

```txt
PENDING
PLAYING
FINISHED
```

Labels frontend recomendados:

```js
const MATCH_STATUS_LABELS = {
  PENDING: "Pendiente",
  PLAYING: "En juego",
  FINISHED: "Finalizado",
};
```

---

## 5.3 Stadium

Representa una sede del torneo.

Campos relevantes:

```txt
_id: ObjectId
name: String
country: String
city: String
capacity: Number
address: String | undefined
createdAt: Date
updatedAt: Date
```

Según la versión actual del contrato, `Match.stadium` puede exponerse como string o como objeto populado. El frontend debe normalizar ambos casos al renderizar.

---

## 6. Validaciones generales con Zod

El backend valida payloads de escritura con Zod antes de llegar a servicios.

Reglas importantes:

- Los IDs tipo `ObjectId` deben ser strings hexadecimales de 24 caracteres.
- Las fechas deben enviarse en formato ISO 8601.
- Los scores deben ser enteros.
- Los scores no pueden ser negativos.
- Los status son case-sensitive.
- Los `PUT` administrativos deben aceptar payloads parciales.
- El frontend no debe enviar strings vacíos para campos numéricos.
- El frontend debe convertir inputs numéricos a `Number` antes de enviar.

Ejemplo de fecha válida:

```json
{
  "date": "2026-06-15T19:00:00.000Z"
}
```

Ejemplo de score válido:

```json
{
  "homeScore": 2,
  "awayScore": 0
}
```

Ejemplo inválido:

```json
{
  "homeScore": "",
  "awayScore": -1,
  "status": "finished"
}
```

---

## 7. Rutas públicas

Todas las rutas públicas están bajo `/api`.

Estas rutas son de lectura y pueden ser consumidas por el frontend público.

## 7.1 Teams

### `GET /api/teams`

Devuelve todos los equipos.

Uso posible:

- catálogos;
- filtros;
- vistas públicas;
- selects si una vista pública o admin lo requiere.

### `GET /api/teams/group/:group`

Devuelve equipos filtrados por grupo.

Ejemplo:

```http
GET /api/teams/group/C
```

Uso posible:

- fixture por grupo;
- tablas;
- vistas auxiliares.

---

## 7.2 Matches

### `GET /api/matches`

Devuelve el fixture completo.

Uso frontend:

- renderizar fixture por grupos;
- renderizar eliminatorias;
- renderizar predicciones;
- leer estados;
- leer resultados oficiales;
- recalcular scoring en cliente.

Respuesta esperada:

- array de `Match`;
- o wrapper con `data`;
- o wrapper con `matches`.

El frontend debe normalizar las variantes.

### `GET /api/matches/:id`

Devuelve el detalle de un partido por ID.

Uso frontend:

- detalle puntual;
- confirmación de estado;
- lectura de resultado oficial actualizado.

### `GET /api/matches/stage/:stage`

Devuelve partidos filtrados por fase.

Ejemplos:

```http
GET /api/matches/stage/GRUPO%20A
GET /api/matches/stage/ROUND_OF_32
GET /api/matches/stage/FINAL
```

Uso frontend:

- filtros por instancia;
- carga parcial de eliminatorias;
- vistas administrativas o públicas específicas.

### `GET /api/matches/schedule/daily?date=YYYY-MM-DD`

Devuelve la agenda diaria o la próxima fecha disponible.

Uso frontend:

- Home Daily Schedule.

Respuesta esperada:

```js
{
  today: Match[],
  next: Match[],
  nextDate: string | null
}
```

Reglas UI:

- si `today` tiene partidos, mostrar partidos de hoy;
- si `today` está vacío y `next` tiene partidos, mostrar próxima fecha disponible;
- si ambos están vacíos, mostrar empty state;
- `nextDate` debe formatearse de forma amigable en español.

Nota Express:

La ruta `/schedule/daily` debe declararse antes de `/:id` para evitar que `schedule` sea interpretado como ID.

---

## 7.3 Standings

### `GET /api/standings`

Devuelve tablas de posiciones calculadas por el backend.

Uso frontend:

- página `/posiciones`;
- lectura de standings oficiales;
- visualización de `position` y `qualifiedTo`.

Respuesta esperada:

```js
{
  status: "success",
  data: [
    {
      group: "A",
      teams: [
        {
          team: {
            _id: "...",
            name: "...",
            shieldUrl: "...",
            group: "A",
            position: 1,
            qualifiedTo: "ROUND_OF_32"
          },
          pj: 3,
          pg: 2,
          pe: 1,
          pp: 0,
          gf: 5,
          gc: 2,
          dif: 3,
          pts: 7
        }
      ]
    }
  ]
}
```

Reglas frontend:

- no recalcular posiciones desde partidos;
- preservar el orden recibido del backend;
- no inventar clasificados;
- mapear `qualifiedTo` a labels visibles.

---

## 8. Rutas administrativas protegidas

Todas las rutas administrativas están bajo `/api/admin`.

Requieren autenticación de administrador.

## 8.1 Actualizar partido

```http
PUT /api/admin/matches/:id
```

Uso:

- cargar goles;
- cambiar estado;
- cargar penales;
- corregir fecha;
- corregir sede;
- disparar Bracket Engine cuando corresponda.

Payload parcial permitido:

```json
{
  "status": "FINISHED",
  "homeScore": 2,
  "awayScore": 1,
  "homePenaltyScore": null,
  "awayPenaltyScore": null
}
```

Reglas frontend:

- enviar solo campos modificados;
- no enviar strings vacíos;
- convertir scores a `Number`;
- penales solo si es eliminatoria empatada;
- si `status` es `FINISHED`, deben existir scores suficientes;
- si es eliminatoria con empate regular, deben existir penales válidos;
- no permitir empate en penales.

Trigger:

Si el partido tiene `matchNumber >= 73` y el payload lo finaliza con `status: "FINISHED"`, el backend dispara el Bracket Engine.

---

## 8.2 Actualizar equipo

```http
PUT /api/admin/teams/:id
```

Uso:

- corrección manual de posición;
- corrección manual de `qualifiedTo`;
- desempates técnicos;
- ajustes por Fair Play, sorteo o decisión administrativa.

Payload parcial posible:

```json
{
  "position": 1,
  "qualifiedTo": "ROUND_OF_32",
  "shieldUrl": "https://..."
}
```

Recomendación:

El admin no debería modificar datos estables como `name` o `group` salvo que el backend lo permita explícitamente y exista una razón clara.

---

## 8.3 Recalcular standings de grupo

```http
POST /api/admin/standings/:group
```

Ejemplo:

```http
POST /api/admin/standings/C
```

Body:

```json
{}
```

Uso:

- calcular estadísticas del grupo;
- ordenar equipos;
- actualizar posiciones;
- actualizar `qualifiedTo` cuando corresponda.

Este endpoint dispara el Standings Engine.

---

## 8.4 Clasificar grupo a 16avos

```http
POST /api/admin/classify-group
```

Uso:

- sembrar clasificados de grupos en partidos de `ROUND_OF_32`;
- conectar fase de grupos con eliminatorias;
- ejecutar el Transition Engine.

Payload recomendado:

```json
{
  "group": "C"
}
```

Reglas:

- toma equipos del grupo con `qualifiedTo: "ROUND_OF_32"`;
- busca slots por placeholders como `1st Group C` o `2nd Group C`;
- inyecta equipos en `homeTeam` o `awayTeam`;
- es idempotente;
- puede ejecutarse varias veces para corregir llaves.

Mejores terceros:

- se gestionan manualmente forzando `qualifiedTo`;
- luego se ejecuta el Transition Engine para sembrarlos en los slots correspondientes;
- el frontend no debe calcular combinaciones de terceros.

---

## 9. Standings Engine

El Standings Engine calcula las posiciones de un grupo desde cero.

### Disparador

```http
POST /api/admin/standings/:group
```

### Qué hace

- lee todos los partidos `FINISHED` del grupo;
- calcula partidos jugados;
- calcula ganados, empatados y perdidos;
- calcula goles a favor;
- calcula goles en contra;
- calcula diferencia de gol;
- calcula puntos;
- ordena equipos;
- actualiza `position`;
- actualiza `qualifiedTo` cuando corresponde.

### Estadísticas calculadas

```txt
PJ  -> partidos jugados
PG  -> partidos ganados
PE  -> partidos empatados
PP  -> partidos perdidos
GF  -> goles a favor
GC  -> goles en contra
DIF -> diferencia de gol
PTS -> puntos
```

### Criterios de ordenamiento

1. Mayor cantidad de puntos.
2. Mayor diferencia de gol.
3. Mayor cantidad de goles a favor.

Si continúa el empate absoluto, el admin puede resolverlo mediante corrección manual en `PUT /api/admin/teams/:id`.

### Regla de cierre de grupo

El motor solo debería asignar tickets finales cuando los 6 partidos del grupo están `FINISHED`.

Regla actual según contrato actualizado:

- posición 1: `ROUND_OF_32`;
- posición 2: `ROUND_OF_32`;
- posición 4: `ELIMINATED`;
- posición 3: queda pendiente o sujeto a lógica/corrección de mejores terceros.

La gestión de mejores terceros se resuelve administrativamente y mediante el Transition Engine, no por el frontend.

---

## 10. Transition Engine

El Transition Engine actúa como puente entre fase de grupos y eliminatorias.

### Disparador

```http
POST /api/admin/classify-group
```

### Qué hace

- toma un grupo específico;
- busca equipos con `qualifiedTo: "ROUND_OF_32"`;
- ubica placeholders compatibles en partidos de 16avos;
- inyecta el equipo en el slot correcto;
- permite reejecución idempotente.

### Ejemplo conceptual

Si un equipo queda 1.º del Grupo C y tiene:

```txt
qualifiedTo: ROUND_OF_32
position: 1
group: C
```

El motor busca un slot:

```txt
placeholderHome: "1st Group C"
```

y asigna el equipo a `homeTeam`.

### Responsabilidad del frontend

El frontend solo debe:

- llamar el endpoint desde admin;
- mostrar confirmación;
- refrescar `GET /api/matches`;
- renderizar los cruces actualizados.

El frontend no debe:

- calcular a qué partido va cada clasificado;
- resolver combinaciones de terceros;
- modificar placeholders;
- sembrar equipos manualmente en llaves salvo que exista una ruta explícita para eso.

---

## 11. Bracket Engine

El Bracket Engine automatiza la progresión dentro de eliminatorias.

### Disparador

Automático al ejecutar:

```http
PUT /api/admin/matches/:id
```

si se cumplen estas condiciones:

```txt
status === "FINISHED"
matchNumber >= 73
```

### Qué hace

- detecta el ganador por goles regulares;
- si hay empate, detecta ganador por penales;
- valida que haya penales si el empate regular lo exige;
- actualiza `qualifiedTo` del ganador;
- actualiza `qualifiedTo` del perdedor;
- envía el ganador al partido indicado por `nextMatchWinner`;
- envía el perdedor al partido indicado por `nextMatchLoser` cuando aplica;
- inyecta equipos según placeholders como `Winner Match 74`.

### Reglas de ganador

- si `homeScore > awayScore`, gana `homeTeam`;
- si `awayScore > homeScore`, gana `awayTeam`;
- si `homeScore === awayScore`, se usan penales;
- si `homePenaltyScore > awayPenaltyScore`, gana `homeTeam`;
- si `awayPenaltyScore > homePenaltyScore`, gana `awayTeam`;
- si faltan penales o empatan los penales, no debe progresar ningún equipo.

### Actualización de `qualifiedTo`

Reglas esperadas:

- ganador de `ROUND_OF_32` -> `ROUND_OF_16`;
- ganador de `ROUND_OF_16` -> `QUARTER_FINALS`;
- ganador de `QUARTER_FINALS` -> `SEMI_FINALS`;
- ganador de semifinal -> `FINAL`;
- perdedor de semifinal -> `THIRD_PLACE_MATCH`;
- perdedor de otras rondas -> `ELIMINATED`;
- ganador de final -> `FINAL`;
- perdedor de final -> `ELIMINATED`.

### Responsabilidad del frontend

El frontend solo debe:

- cargar resultado;
- cargar penales si aplica;
- guardar con `PUT /api/admin/matches/:id`;
- refrescar `GET /api/matches`;
- renderizar el bracket actualizado.

El frontend no debe:

- mover ganadores a mano;
- calcular `nextMatchWinner`;
- calcular `nextMatchLoser`;
- asignar `qualifiedTo` por su cuenta;
- resolver slots de eliminatorias.

---

## 12. Locking de predicciones

Prediction Fixture debe bloquear predicciones usando `status` y `date`.

### `PENDING`

- el partido todavía no empezó;
- la predicción es editable solo si `now < match.date`.

### `PLAYING`

- el partido ya empezó;
- la predicción debe estar bloqueada.

### `FINISHED`

- el partido terminó;
- la predicción debe estar bloqueada;
- puede calcularse scoring si hay resultado oficial suficiente.

Regla adicional:

```txt
Si now >= match.date, bloquear aunque status siga en PENDING.
```

---

## 13. Resultado oficial

El resultado oficial se lee desde:

```txt
homeScore
awayScore
homePenaltyScore
awayPenaltyScore
```

Reglas:

- no calcular scoring si faltan datos oficiales;
- `homeScore` y `awayScore` son necesarios para cualquier scoring;
- en eliminatorias empatadas, los penales son necesarios para determinar clasificado;
- no derivar ganador si los datos son inconsistentes.

---

## 14. Scoring de fase de grupos

Reglas actuales para Prediction Fixture:

- 1 punto por acertar ganador.
- 2 puntos por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.
- 1 punto por acertar empate.
- 1 punto por acertar cantidad exacta de goles del empate.

No calcular scoring si:

- el partido no está `FINISHED`;
- faltan `homeScore` o `awayScore`;
- el payload oficial es inconsistente.

---

## 15. Scoring de eliminatorias

Prediction Fixture distingue partidos definidos en goles regulares y partidos definidos por penales.

### Partido definido en marcador regular

- 2 puntos por acertar ganador/clasificado.
- 1 punto por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.

### Partido empatado y definido por penales

- 2 puntos por acertar ganador/clasificado.
- 1 punto por acertar que el partido terminó empatado en goles.
- 1 punto por acertar cantidad exacta de goles del empate.
- 1 punto por acertar penales del ganador.
- 1 punto por acertar penales del perdedor.

Reglas de validación:

- si el usuario predice empate regular en eliminatorias, debe completar penales;
- si los penales predichos empatan, la predicción es inválida;
- si faltan penales, la predicción es inválida;
- no permitir predicciones de eliminatorias sobre placeholders;
- habilitar predicciones de eliminatorias solo cuando `homeTeam` y `awayTeam` estén definidos.

---

## 16. UI/UX esperada para Prediction Fixture

Cuando un partido termina, la UI debe mostrar:

- predicción del usuario;
- resultado oficial;
- puntos obtenidos;
- indicadores de acierto;
- penales si existieron.

Indicadores visibles recomendados:

```txt
Ganador acertado
Clasificado acertado
Empate acertado
Goles del ganador acertados
Goles del perdedor acertados
Goles del empate acertados
Penales del ganador acertados
Penales del perdedor acertados
```

Los indicadores no deben depender solo de color. Deben tener texto visible.

---

## 17. Reglas frontend para payloads admin

Al construir payloads para rutas privadas:

- enviar payload parcial;
- no enviar objeto completo innecesario;
- no enviar campos vacíos como `""`;
- convertir números desde inputs a `Number`;
- convertir fecha a ISO 8601;
- no enviar penales si no aplican;
- no enviar status traducidos;
- no calcular posiciones;
- no calcular clasificados;
- no calcular llaves.

Ejemplo correcto:

```json
{
  "status": "FINISHED",
  "homeScore": 1,
  "awayScore": 1,
  "homePenaltyScore": 4,
  "awayPenaltyScore": 3
}
```

Ejemplo incorrecto:

```json
{
  "status": "Finalizado",
  "homeScore": "1",
  "awayScore": "",
  "homePenaltyScore": "4"
}
```

---

## 18. Notas para implementación frontend

- Usar `VITE_API_BASE_URL`.
- Usar `axiosClient`.
- Para rutas admin, configurar `withCredentials: true`.
- No hardcodear URLs productivas.
- No mostrar errores técnicos crudos al usuario.
- Centralizar manejo de errores.
- Normalizar respuestas si vienen como array directo, `data` o `matches`.
- El frontend debe confiar en el backend como fuente de verdad para standings y bracket.
- El frontend no debe duplicar engines de torneo.

---

## 19. Implicancias para próximos bloques del frontend

### Bloque recomendado: Admin Auth & Protected Layout

Objetivo:

- `/admin/login`;
- `/admin/dashboard`;
- ruta protegida;
- `authSlice`;
- `adminAuthService`;
- login/logout;
- restauración con `/api/auth/me` si existe.

### Bloque recomendado: Admin Match Results

Objetivo:

- listar partidos;
- filtrar por grupo/fase/status;
- cargar resultados;
- cargar penales;
- disparar Bracket Engine indirectamente al finalizar eliminatorias;
- refrescar partidos después del guardado.

### Bloque recomendado: Admin Standings & Transition

Objetivo:

- recalcular grupo con `POST /api/admin/standings/:group`;
- sembrar grupo con `POST /api/admin/classify-group`;
- mostrar estado de grupo;
- no calcular clasificados desde React.

### Bloque recomendado: Admin Team Corrections

Objetivo:

- permitir correcciones manuales limitadas;
- editar `position`;
- editar `qualifiedTo`;
- editar `shieldUrl`;
- usarlo solo para desempates o casos excepcionales.

### Bloque recomendado: Knockout & Predictions Polish

Objetivo:

- renderizar eliminatorias por `matchNumber`;
- respetar placeholders;
- habilitar predicciones solo con equipos reales;
- sumar scoring de penales;
- reflejar progresión del Bracket Engine tras `GET /api/matches`.

---

## 20. Resumen de responsabilidades

```txt
Backend:
- valida datos;
- calcula standings;
- asigna clasificados;
- siembra 16avos;
- progresa bracket;
- actualiza qualifiedTo;
- expone resultados oficiales.

Frontend:
- renderiza datos;
- administra formularios;
- envía payloads limpios;
- bloquea predicciones;
- calcula scoring local;
- muestra feedback al usuario;
- no duplica reglas de torneo.
```