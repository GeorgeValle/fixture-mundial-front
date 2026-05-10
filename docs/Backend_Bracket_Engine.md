# ⚙️ Documentación Técnica: Bracket Engine (Motor de Eliminatorias)

Este documento describe la lógica, activación y flujo de datos del motor encargado de gestionar el avance de los equipos durante la fase eliminatoria (Knockout Stage) del Mundial 2026.

---

## 1. ¿Cómo funciona el Engine?

El **Bracket Engine** es un servicio del backend (`BracketService.js`) que automatiza la progresión del torneo. Su función principal es actuar como un "puente" entre partidos basándose en una estructura de llaves predefinida.

### Componentes Clave:
* **`matchNumber`**: Identificador único numérico (del 73 al 104) para cada partido de eliminatoria.
* **`nextMatchWinner`**: Puntero que indica a qué número de partido debe avanzar el equipo ganador.
* **`nextMatchLoser`**: Puntero específico para semifinales que indica qué equipo va al partido por el tercer puesto.
* **`placeholders`**: Etiquetas técnicas (ej: `Winner Match 74`) que el motor usa para saber si debe colocar al equipo en la posición de Local o Visitante del siguiente encuentro.

---

## 2. Activación (El Disparador)

El motor **no se llama mediante una ruta propia**, sino que funciona como un **Trigger (Disparador)** dentro de la operación de actualización de partidos.

### Flujo de Activación:
1. El Administrador envía un `PUT /api/matches/:id` con el resultado y el campo `status: "FINISHED"`.
2. El **MatchController** recibe la respuesta exitosa de la base de datos.
3. Se evalúa la condición de activación:
   - ¿El estado enviado es `FINISHED`?
   - ¿El `matchNumber` del partido es `>= 73`?
4. Si se cumplen ambas, se dispara `BracketService.progressKnockoutWinner()` en segundo plano.

---

## 3. Lógica de Decisión (Algoritmo de Avance)

El motor determina el ganador siguiendo este orden de prioridad:
1. **Goles Regulares**: Si `homeScore` es diferente de `awayScore`, se determina el ganador.
2. **Penales**: Si hay empate en goles, el motor busca los campos `homePenaltyScore` y `awayPenaltyScore`.
3. **Validación**: Si el partido está empatado y no hay penales cargados, el motor registra un error de inconsistencia y no avanza a ningún equipo.

---

## 4. Ejemplo de Respuesta y Efecto en DB

### Paso A: El Admin finaliza el Partido 74
**Petición (Frontend):** `PUT /api/matches/id_match_74`
```json
{
  "status": "FINISHED",
  "homeScore": 2,
  "awayScore": 1
}

### Paso B: El Motor se activa
El motor detecta que el **Ganador es el Equipo Local** y que el `nextMatchWinner` del Partido 74 es el **Partido 89**.

### Paso C: Resultado en la Base de Datos (Partido 89)
El Partido 89, que originalmente estaba vacío, se actualiza automáticamente:

**Estado anterior del Partido 89:**
```json
{
  "matchNumber": 89,
  "placeholderHome": "Winner Match 74",
  "homeTeam": null,
  "awayTeam": null
}
```

**Estado posterior (Actualizado por el Engine):**
```json
{
  "matchNumber": 89,
  "placeholderHome": "Winner Match 74",
  "homeTeam": "ID_DEL_EQUIPO_GANADOR_74",
  "awayTeam": null
}
```

---

## 5. Beneficios para el Sistema
* **Cero errores manuales**: Evita que el administrador asigne equipos por error en llaves equivocadas.
* **Sincronización Total**: El frontend recibe el fixture actualizado instantáneamente al consultar `GET /api/matches`.
* **Escalabilidad**: Permite gestionar empates y definiciones por penales de forma nativa sin lógica extra en el cliente.