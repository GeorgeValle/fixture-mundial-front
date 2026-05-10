# ⚙️ Documentación Técnica: Transition Engine (Motor de Transición)

Este documento describe la lógica y el funcionamiento del **Transition Engine**, el servicio encargado de tomar a los equipos clasificados de la Fase de Grupos y ubicarlos en sus respectivos lugares en el cuadro de Eliminatorias (Knockout Stage).

---

## 1. ¿Cómo funciona el Engine?

El **Transition Engine** (`TransitionService.js`) actúa como un puente entre la Fase de Grupos y las Eliminatorias. A diferencia del Bracket Engine (que reacciona automáticamente), este motor se ejecuta a demanda para permitir al administrador armar las llaves de 16avos una vez que se han resuelto las posiciones finales (incluyendo los mejores terceros).

### Objetivo Principal:
Buscar en la base de datos a los equipos con estado `qualifiedTo: 'ROUND_OF_32'` y asignarlos a los partidos de eliminatorias según los `placeholders` predefinidos (ej: `1st Group C` o `2nd Group A`).

---

## 2. Activación (El Disparador)

El motor se activa mediante una ruta **PRIVADA** y explícita del panel de administración.

* **Ruta**: `POST /api/admin/classify-group`
* **Body Requerido**: `{ "group": "A" }`
* **Seguridad**: Requiere autenticación con rol `ADMIN` (validado mediante `authMiddleware.js`).

---

## 3. Lógica de Asignación

El proceso que sigue el servicio al recibir la orden de clasificar a un grupo es:

1. **Búsqueda de Clasificados**: El `TeamDAO` busca a todos los equipos del grupo especificado que tengan `qualifiedTo === 'ROUND_OF_32'`.
2. **Generación de Claves**: Por cada equipo encontrado, genera un "string mágico" que funciona como llave de encaje. 
   - Si el equipo terminó 1ro: `"1st Group X"`.
   - Si terminó 2do: `"2nd Group X"`.
3. **Búsqueda y Reemplazo**: El `MatchDAO` busca en la colección de Partidos de Eliminatorias si hay algún encuentro que tenga ese string mágico en su `placeholderHome` o `placeholderAway`.
4. **Inyección**: Al encontrar el partido, inyecta el `_id` del equipo, transformando el partido vacío en un encuentro real.

> **Nota sobre Idempotencia**: La función está diseñada para ser idempotente. Puede ejecutarse múltiples veces sin duplicar datos ni causar errores. Si un equipo cambia de posición por una corrección manual, volver a correr el motor actualizará su lugar en la llave.

---

## 4. El caso de los Mejores Terceros

Para cumplir con el reglamento del Mundial 2026 (clasifican los 8 mejores terceros), el motor contempla los placeholders del tipo `"3rd Group A/B/C/D/F"`.

La asignación de estos equipos se realiza de manera manual por parte del administrador (mediante una ruta de forzado de posición) y luego se ejecuta el motor para que impacte el cambio en el Bracket. Mientras no se defina, el slot correspondiente en el partido permanecerá como `null`.

---

## 5. Beneficios de esta Capa Intermedia

* **Agnóstico a BD**: El controlador nunca interactúa directamente con Mongoose.
* **Control Manual**: Evita clasificaciones accidentales antes de que todos los partidos y mejores terceros estén confirmados.
* **Flexibilidad**: Permite visualizar el avance del torneo (ej: mostrando a los 1ros y 2dos ya confirmados) mientras se espera el cierre de otros grupos.