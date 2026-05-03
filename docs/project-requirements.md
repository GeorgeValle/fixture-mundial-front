# Project Requirements

## Propósito

Este documento resume el alcance, stack, restricciones y reglas generales de `fixture-mundial-front`.

No reemplaza al README ni a los documentos específicos por página. Para detalles de implementación, consultar:

- `docs/home.md`
- `docs/group-fixtures.md`
- `docs/group-standings.md`
- `docs/knockout-stage.md`
- `docs/prediction-fixture.md`
- `docs/api-contract.md`

## Objetivo del proyecto

Construir el frontend de una app de portfolio para visualizar fixture, posiciones, eliminatorias y predicciones personales del Mundial 2026.

El backend existente provee datos de la base de datos. El frontend presenta esos datos, valida respuestas cuando corresponde y mantiene predicciones del usuario en estado local del navegador.

## Stack actual

- React.
- Vite.
- JavaScript.
- CSS Modules.
- Axios.
- React Router DOM.
- Redux Toolkit.
- React Redux.
- Zod.
- Vitest.
- React Testing Library.
- MSW.
- pnpm.

## Restricciones técnicas

- No TypeScript.
- No Tailwind CSS.
- No Bootstrap.
- No Material UI, Chakra UI, Styled Components, Emotion ni frameworks UI.
- No npm ni yarn.
- No recrear ni re-scaffoldear el proyecto Vite.
- No hardcodear URLs productivas en servicios.
- No commitear secretos.

## Configuración de backend

La URL base se configura con:

```text
VITE_API_BASE_URL
```

Ejemplo:

```env
VITE_API_BASE_URL=http://localhost:3000
```

El cliente Axios centralizado vive en:

```text
src/services/api/axiosClient.js
```

## Rutas principales implementadas

| Ruta | Sección | Estado |
| --- | --- | --- |
| `/` | Home | Implementada |
| `/grupos` | Fixture de grupos | Implementada |
| `/posiciones` | Tabla de posiciones | Implementada |
| `/eliminatorias` | Eliminatorias | Implementada |
| `/predicciones` | Predicciones | Implementada |

## Rutas futuras/opcionales

Estas rutas existen como secciones futuras/opcionales y no forman parte del Navbar principal:

| Ruta | Sección |
| --- | --- |
| `/partidos` | Partidos |
| `/equipos` | Equipos |
| `/estadios` | Estadios |

## Endpoints públicos usados actualmente

El contrato público está documentado en `docs/api-contract.md`.

Endpoints usados hoy por la UI:

- `GET /api/matches`
- `GET /api/matches/schedule/daily?date=YYYY-MM-DD`
- `GET /api/standings`

No se consideran uso público actual del frontend:

- `POST /api/standings/:group`
- `PUT /api/matches/:id`
- `GET /api/teams`
- `GET /api/stadiums`
- rutas administrativas o de mantenimiento.

## Reglas de datos

- El backend configurado es la fuente de datos para partidos, equipos, sedes, estados y resultados registrados.
- El frontend no inventa equipos clasificados, resultados, penales ni progresión de eliminatorias.
- Las tablas de posiciones se consumen desde `GET /api/standings`; no se recalculan en frontend.
- Las predicciones del usuario se guardan en `localStorage`.
- Los escudos/banderas vienen desde URLs provistas por datos del backend.

## Reglas de UI/UX

- La UI visible debe estar en español.
- Nombres técnicos, rutas, archivos, componentes y claves internas pueden mantenerse en inglés.
- Navbar visible en todas las vistas principales.
- Cada sección backend-powered debe manejar loading, delayed loading, error, empty state y datos válidos cuando aplique.
- No mostrar errores técnicos crudos al usuario.
- Usar `FeedbackModal` para demoras relevantes.
- Usar `SkeletonList`/skeletons para cargas.

## Reglas de arquitectura

- Servicios API en `src/services/`.
- Validaciones/normalización en `src/schemas/` o utilidades puras.
- Componentes presentacionales sin llamadas directas al backend.
- CSS Modules por componente/página.
- Global CSS mínimo para variables, reset y base.
- Redux Toolkit reservado para estado global compartido, como feedback/loading.

## Prediction Fixture

Reglas actuales:

- Predicciones guardadas en `fixtureMundial.predictions`.
- Partidos `PLAYING` o `FINISHED` bloquean edición.
- Si `now >= match.date`, la predicción se bloquea aunque el estado siga pendiente.
- Scores de predicción: enteros entre 0 y 20.
- Nombre de participante: requerido, 2-40 caracteres, con letras.
- Eliminatorias permanecen cerradas para predicción hasta que se apruebe el flujo sobre cruces registrados en la base de datos.

## Testing esperado

Todo cambio de comportamiento debe incluir o actualizar tests.

Áreas cubiertas o esperadas:

- render de páginas;
- servicios y schemas;
- estados loading/error/empty;
- delayed loading;
- localStorage;
- scoring;
- locking;
- validación de inputs;
- adapters de eliminatorias;
- componentes compartidos.

## Validación de entorno

Antes de ejecutar comandos de validación en WSL:

```bash
source ~/.nvm/nvm.sh && nvm use 24
which node
which pnpm
type -a node
type -a pnpm
```

Luego:

```bash
pnpm run build
pnpm run lint
pnpm run test
```

## Alcance actual

Implementado:

- Home con agenda diaria/próxima fecha.
- Fixture por grupos.
- Tabla de posiciones.
- Eliminatorias con cuadro base + merge de datos reales.
- Predicciones de fase de grupos con localStorage, locking, scoring, reset e impresión.
- Documentación final de Bloque 8.

Pendiente/futuro:

- Copy polish visible para reemplazar términos técnicos.
- Predicción completa de eliminatorias con campos visibles de penales.
- Exportación PDF.
- Páginas futuras `/partidos`, `/equipos`, `/estadios`.
