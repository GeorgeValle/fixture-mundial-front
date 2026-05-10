# 🏆 API Contract y Especificación de Lógica - Mundial 2026 Backend

Este documento detalla la estructura, las reglas de negocio y los contratos de datos del backend para la aplicación del Mundial 2026. Sirve como guía definitiva para la conexión entre el frontend y los motores internos de torneo.

---

## 1. Alcance y Filosofía Arquitectónica

* **Agnosticismo de Base de Datos:** La lógica de negocio está completamente separada de las consultas a Mongoose mediante el uso de **DAOs** (Data Access Objects). Los Servicios y Controladores no conocen la tecnología de persistencia subyacente.
* **Validación Estricta:** Todas las entradas a la API están blindadas por **Zod**, garantizando integridad de datos antes de llegar a la capa de servicios.
* **Automatización Segura:** Los avances de fase (grupos a eliminatorias) y progresiones (octavos a cuartos) están gestionados por "Engines" internos (Standings, Transition y Bracket).

---

## 2. Modelos de Datos (Entidades Principales)

### 2.1 Equipo (`Team`)

Representa a una selección nacional participante.

**Esquema:**
* `name`: `String` (Ej: "Argentina")
* `flagUrl`: `String` (URL de la bandera)
* `group`: `String` (Ej: "A", "B", ... "L")
* `position`: `Number | null` (Posición final en el grupo. Se llena vía Standings Engine).
* `qualifiedTo`: `String | null` (Instancia alcanzada). Valores permitidos:
    * `ROUND_OF_32`
    * `ROUND_OF_16`
    * `QUARTER_FINALS`
    * `SEMI_FINALS`
    * `THIRD_PLACE_MATCH`
    * `FINAL`
    * `ELIMINATED`

### 2.2 Partido (`Match`)

Representa un encuentro, ya sea de fase de grupos o eliminatoria.

**Esquema:**
* `homeTeam`: `ObjectId | null` (Referencia a `Team`)
* `awayTeam`: `ObjectId | null` (Referencia a `Team`)
* `date`: `Date`
* `stadium`: `String`
* `stage`: `String` (Fase del torneo, ej: "GRUPO A", "ROUND_OF_32", "FINAL").
* `status`: `String` (Estado actual). Valores: `"PENDING"`, `"IN_PROGRESS"`, `"FINISHED"`.
* `homeScore`: `Number` (Goles regulares local).
* `awayScore`: `Number` (Goles regulares visitante).
* `homePenaltyScore`: `Number | null` (Penales local - Solo eliminatorias).
* `awayPenaltyScore`: `Number | null` (Penales visitante - Solo eliminatorias).
* *Campos exclusivos del Bracket Engine (Eliminatorias):*
    * `matchNumber`: `Number` (ID numérico del 73 al 104).
    * `placeholderHome`: `String` (Ej: "1st Group C", "Winner Match 74").
    * `placeholderAway`: `String`
    * `nextMatchWinner`: `Number` (Puntero al siguiente partido).
    * `nextMatchLoser`: `Number` (Puntero para semifinales).

---

## 3. Endpoints de la API

Todas las rutas públicas están bajo el prefijo `/api/`. Las rutas privadas están bajo `/api/admin/` y requieren token JWT (o equivalente manejado por `authMiddleware`).

### 3.1 Rutas Públicas (Lectura para el Frontend)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **GET** | `/api/teams` | Devuelve todos los equipos. |
| **GET** | `/api/teams/group/:group` | Devuelve equipos filtrados por grupo (A-L). |
| **GET** | `/api/matches` | Devuelve todos los partidos (fixture completo). |
| **GET** | `/api/matches/stage/:stage`| Devuelve partidos filtrados por fase (ej: "ROUND_OF_32"). |

### 3.2 Rutas Administrativas (Protegidas)

*Se requiere header de autorización válido.*

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **PUT** | `/api/admin/matches/:id` | Actualiza un partido (goles, estado, penales). Dispara el *Bracket Engine* si es eliminatoria. |
| **PUT** | `/api/admin/teams/:id` | Actualiza un equipo. Usado para forzar posiciones en empates técnicos (moneda). |
| **POST** | `/api/admin/standings/:group` | Calcula posiciones y estadísticas de un grupo (*Standings Engine*). |
| **POST** | `/api/admin/classify-group` | *(Nuevo)* Siembra los clasificados de un grupo en el fixture de 16avos (*Transition Engine*). |

---

## 4. Lógica de Negocio y Motores (Engines)

El core del sistema descansa en tres motores independientes que reaccionan a las acciones del administrador.

### 4.1 Standings Engine (Motor de Posiciones)
**Disparador:** `POST /api/admin/standings/:group`
* Lee todos los partidos `FINISHED` del grupo.
* Calcula Puntos (3/1/0), Diferencia de Gol y Goles a Favor.
* Ordena a los 4 equipos según los criterios FIFA.
* **Regla de Seguridad:** Solo asigna el ticket `ROUND_OF_32` a los puestos 1 y 2 (y `ELIMINATED` al 4) **si y solo si** los 6 partidos del grupo están finalizados.
* Respeta las decisiones previas si el admin forzó un valor (ej: sorteo por moneda).

### 4.2 Transition Engine (Motor de Transición)
**Disparador:** `POST /api/admin/classify-group`
* Actúa como puente entre grupos y eliminatorias.
* Busca a los equipos con `qualifiedTo: 'ROUND_OF_32'` de un grupo específico.
* Localiza los partidos de eliminatorias que los esperan (vía `placeholderHome/Away`, ej: "1st Group C").
* Inyecta el ID del equipo en el partido. Es idempotente (puede ejecutarse múltiples veces para corregir llaves).
* *Los mejores terceros se asignan manualmente forzando su estado y luego corriendo este motor.*

### 4.3 Bracket Engine (Motor de Eliminatorias)
**Disparador:** Automático al hacer `PUT /api/admin/matches/:id` con `status: "FINISHED"` y `matchNumber >= 73`.
* Evalúa el ganador del partido (por goles regulares o penales obligatorios en caso de empate).
* Actualiza el estado `qualifiedTo` del ganador a la siguiente fase (Ej: de `ROUND_OF_32` pasa a `ROUND_OF_16`).
* Actualiza al perdedor a `ELIMINATED` (o `THIRD_PLACE_MATCH` si son semifinales).
* Busca el partido apuntado por `nextMatchWinner` e inyecta al ganador en el slot libre según el `placeholder` (Ej: "Winner Match 74").