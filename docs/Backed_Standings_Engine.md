# ⚙️ Documentación Técnica: Standings Engine (Motor de Posiciones)

Este documento detalla la lógica de cálculo, los criterios de ordenamiento y el impacto en la base de datos del motor encargado de generar las tablas de posiciones de la Fase de Grupos del Mundial 2026.

---

## 1. ¿Cómo funciona el Engine?

El **Standings Engine** (`StandingsService.js`) es un servicio que lee todos los partidos finalizados de un grupo específico y recalcula desde cero las estadísticas de los 4 equipos involucrados. 

A diferencia del Bracket Engine (que reacciona partido a partido), el Standings Engine realiza un cálculo global del grupo para garantizar que los desempates se apliquen correctamente.

### Estadísticas Calculadas:
* **PJ (Partidos Jugados)**: Cantidad de partidos con `status: "FINISHED"`.
* **PG (Ganados)**: 3 puntos.
* **PE (Empatados)**: 1 punto.
* **PP (Perdidos)**: 0 puntos.
* **GF (Goles a Favor)**: Suma de `homeScore` o `awayScore` a favor.
* **GC (Goles en Contra)**: Suma de goles recibidos.
* **DIF (Diferencia de Gol)**: `GF - GC`.
* **PTS (Puntos Totales)**: `(PG * 3) + (PE * 1)`.

---

## 2. Activación (El Disparador)

El recálculo de un grupo se dispara mediante una ruta **PRIVADA** y explícita, a la que el administrador llama desde el Dashboard.

* **Ruta**: `POST /api/standings/:group` (Ej: `POST /api/standings/C`)
* **Body**: Vacío `{}`
* **Requisito**: Cookie `HttpOnly` con rol `ADMIN`.

> **Nota Arquitectónica**: Se optó por un disparo manual/explícito en lugar de uno automático por cada partido para evitar sobrecarga de cálculos en la base de datos durante la carga masiva de resultados y permitir al administrador controlar el momento exacto en que se "cierra" un grupo.

---

## 3. Criterios de Ordenamiento (Desempate)

Una vez calculadas las estadísticas, el motor ordena el array de equipos de mayor a menor utilizando los criterios oficiales básicos de la FIFA:

1. Mayor cantidad de **Puntos (PTS)**.
2. Mayor **Diferencia de Gol (DIF)**.
3. Mayor cantidad de **Goles a Favor (GF)**.

*(En caso de empate absoluto en estos tres criterios, el administrador puede forzar la posición manualmente mediante un `PUT /api/teams/:id` tras un sorteo o revisión de Fair Play).*

---

## 4. Efecto en la Base de Datos (Clasificación Automática)

El Standings Engine no solo devuelve un JSON para que el frontend dibuje la tabla, sino que **impacta directamente en la colección `Teams`** de MongoDB.

Al finalizar el cálculo y el ordenamiento, el motor inyecta automáticamente los siguientes datos en cada equipo del grupo:
* **`position`**: Asigna `1`, `2`, `3` o `4` según su lugar en la tabla generada.
* **`qualifiedTo`**: 
  * A los equipos en posición 1 y 2: les asigna `"16AVOS"`.
  * A los equipos en posición 3 y 4 (o al resto según lógica de mejores terceros): les asigna `"ELIMINADO"`.

---

## 5. Ejemplo de Respuesta (Payload)

**Petición:** `POST /api/standings/C`

**Respuesta Exitosa (200 OK):**
```json
{
  "status": "success",
  "message": "Grupo C actualizado en DB",
  "data": [
    {
      "team": { 
        "_id": "60d5ec...", 
        "name": "Argentina", 
        "group": "C",
        "position": 1,
        "qualifiedTo": "16AVOS"
      },
      "pj": 3,
      "pg": 3,
      "pe": 0,
      "pp": 0,
      "gf": 5,
      "gc": 0,
      "dif": 5,
      "pts": 9
    },
    {
      "team": { "name": "México", "position": 2, "qualifiedTo": "16AVOS", ... },
      "pj": 3,
      "pg": 1,
      "pe": 1,
      "pp": 1,
      "gf": 3,
      "gc": 3,
      "dif": 0,
      "pts": 4
    }
    // ... Equipos en posición 3 y 4
  ]
}