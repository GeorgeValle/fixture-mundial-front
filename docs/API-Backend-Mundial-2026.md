# 🏆 Documentación Técnica: API Backend - Fixture Mundial 2026 (Completa)

Esta documentación detalla la arquitectura, el flujo de datos y el catálogo completo de endpoints de la API. Está diseñada para servir de contexto técnico tanto para desarrolladores como para agentes de IA que trabajen en el frontend.

## 1. Arquitectura y Stack
- **Arquitectura:** N-Capas (Routes -> Controllers -> Services -> DAOs -> Models).
- **Runtime:** Node.js (ES Modules).
- **Base de Datos:** MongoDB (Mongoose v8).
- **Validación de Datos:** Zod v4 (Esquemas de tipado estricto).
- **Patrón de Persistencia:** Factory Pattern (Permite cambiar de DB sin tocar la lógica).

---

## 2. Modelos de Datos (Mongoose)

### 2.1 Equipos (Teams)
Representa a las selecciones nacionales y su progreso en el torneo.
- `name`: String (Único).
- `shieldUrl`: String (URL de Cloudinary/SVG).
- `group`: String (Letra A-L).
- `confederation`: String (CONMEBOL, UEFA, etc.).
- `position`: Number (1-4, `null` por defecto).
- `qualifiedTo`: Enum [`16AVOS`, `OCTAVOS`, `CUARTOS`, `SEMIFINAL`, `3RO`, `FINAL`, `ELIMINADO`, `null`].

### 2.2 Estadios (Stadiums)
- `name`: String (Único).
- `country`: String.
- `city`: String.
- `capacity`: Number.
- `address`: String (Opcional).

---

## 3. Endpoints: Equipos y Estadios

### 3.1 Equipos (`/api/teams`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **GET** | `/` | Lista todas las selecciones registradas. |
| **GET** | `/:id` | Obtiene el detalle de un equipo por ID. |
| **POST** | `/` | Crea un equipo. Valida `name` único y formato de grupo. |
| **PUT** | `/:id` | Actualiza datos (usado para cargar `position` o `qualifiedTo`). |

### 3.2 Estadios (`/api/stadiums`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **GET** | `/` | Lista todas las sedes mundialistas. |
| **GET** | `/name/:name` | Búsqueda por nombre (Case-insensitive y Regex). |
| **POST** | `/` | Registra un nuevo estadio (Capacidad > 0 obligatoria). |

---

## 4. Endpoints: Partidos y Calendario (`/api/matches`)

El modelo de Partidos es el núcleo relacional. Incluye `homeTeam`, `awayTeam` y `stadium` como referencias que se entregan **pobladas** (objeto completo).

### 4.1 Rutas Principales
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **GET** | `/` | Devuelve el fixture completo ordenado por fecha. |
| **GET** | `/schedule/daily` | **Smart Schedule:** Filtra partidos de 'Hoy' y del próximo día disponible. |
| **POST** | `/` | Crea un partido. Valida que `homeTeam !== awayTeam`. |
| **PUT** | `/:id` | Carga resultados (`homeScore`, `awayScore`) y penales. |

### 4.2 El Calendario Inteligente (`GET /schedule/daily?date=YYYY-MM-DD`)
Este endpoint es vital para el Front. Devuelve:
- `today`: Array de partidos que ocurren en la fecha enviada (o fecha actual).
- `next`: Array de partidos del **primer día futuro que tenga actividad**.
- `nextDate`: String ISO de la fecha de los próximos partidos.

---

## 5. Endpoints: Tablas de Posiciones (`/api/standings`)

Este módulo procesa los resultados de los partidos para generar las clasificaciones.

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **GET** | `/` | **Dashboard Global:** Devuelve los 12 grupos (A-L) ordenados por puntos. |
| **POST** | `/:group` | Calcula la tabla de un grupo y **actualiza** las propiedades `position` y `qualifiedTo` en los equipos correspondientes en la DB. |

---

## 6. Lógica de Negocio y Reglas Especiales

### 6.1 Criterios de Desempate (Fase de Grupos)
El `StandingsService` ordena automáticamente a los equipos siguiendo este orden:
1. **Puntos** (3 por victoria, 1 por empate).
2. **Diferencia de Goles** (Goles a Favor - Goles en Contra).
3. **Goles a Favor**.

### 6.2 Gestión de Penales
En fases eliminatorias (`stage !== 'GRUPO X'`), si el `status` es `FINISHED` y los goles regulares empatan, los campos `homePenaltyScore` y `awayPenaltyScore` se vuelven obligatorios para determinar quién avanza.

### 6.3 Validaciones con Zod v4
- **Seguridad de IDs:** Todos los IDs de Mongo se validan con Regex para asegurar que sean de 24 caracteres hexadecimales.
- **Fechas:** Se exige formato ISO 8601 (`z.iso.datetime()`).
- **Estados:** El sistema solo permite transiciones entre `PENDING`, `PLAYING` y `FINISHED`.

---

## 7. Notas para el Frontend
- **Población (Populate):** No es necesario hacer peticiones extra para obtener el escudo de un equipo o la ciudad de un estadio; el backend ya envía los objetos anidados en la respuesta del partido.
- **Desacoplamiento:** El sistema utiliza el patrón DAO para que las consultas por fecha (`getByDateRange`) sean agnósticas a la base de datos.