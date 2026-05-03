# Fixture Mundial 2026 Frontend

Frontend de portfolio para consultar el fixture del Mundial 2026, revisar tablas de posiciones, visualizar el cuadro de eliminatorias y guardar predicciones personales. La aplicación consume un backend existente de Node.js/Express y mantiene la experiencia visible en español.

Este repositorio corresponde solo al frontend. No incluye una fuente de datos propia ni branding oficial FIFA.

## Objetivo

El objetivo del proyecto es presentar una experiencia clara y navegable para seguir el torneo:

- partidos del día o próxima fecha disponible;
- fixture de fase de grupos;
- tablas de posiciones por grupo;
- cuadro de eliminatorias con información recibida desde el backend cuando esté disponible;
- predicciones locales del usuario con scoring contra resultados confirmados.

## Funcionalidades principales

- **Home**: muestra partidos de hoy o la próxima jornada con actividad.
- **Fixture por grupos**: permite elegir grupos A-L y consultar sus seis partidos.
- **Tabla de posiciones**: muestra standings calculados por el backend.
- **Eliminatorias**: presenta el cuadro base y lo combina con datos reales cuando existan.
- **Predicciones**: guarda pronósticos en `localStorage`, bloquea partidos iniciados/finalizados y calcula puntos sobre resultados confirmados.
- **Estados de UI**: loading, delayed loading, error, empty state y datos válidos.
- **Feedback amigable**: evita mostrar errores técnicos crudos al usuario.

## Stack tecnológico

- React
- Vite
- JavaScript
- CSS Modules
- Axios
- React Router DOM
- Redux Toolkit
- React Redux
- Zod
- Vitest
- React Testing Library
- MSW
- pnpm

Restricciones del proyecto:

- Sin TypeScript.
- Sin Tailwind CSS.
- Sin Bootstrap ni frameworks UI.
- Sin npm ni yarn para gestión de paquetes.

## Arquitectura general

Estructura principal:

```text
src/
  app/                 # Store Redux
  components/          # Componentes reutilizables con CSS Modules
  constants/           # Rutas, grupos, storage keys y constantes compartidas
  data/                # Datos documentados de soporte, como skeleton de eliminatorias
  features/            # Slices de Redux
  layouts/             # Layouts de aplicación
  pages/               # Páginas principales
  routes/              # Configuración de rutas
  schemas/             # Validación/normalización con Zod
  services/            # Axios client, servicios API, errores y localStorage
  test/                # Setup de tests y MSW
  utils/               # Utilidades puras
```

Flujo recomendado:

1. La página maneja estado de pantalla.
2. El servicio consume el backend o `localStorage`.
3. Los schemas validan/normalizan respuestas.
4. Los componentes reciben props y renderizan UI.
5. Los CSS Modules mantienen estilos encapsulados por componente.

## Rutas principales

| Ruta | Sección | Estado |
| --- | --- | --- |
| `/` | Home | Implementada |
| `/grupos` | Fixture de grupos | Implementada |
| `/posiciones` | Tabla de posiciones | Implementada |
| `/eliminatorias` | Cuadro de eliminatorias | Implementada |
| `/predicciones` | Predicciones | Implementada |

Rutas futuras/opcionales, fuera del Navbar principal:

| Ruta | Sección |
| --- | --- |
| `/partidos` | Partidos |
| `/equipos` | Equipos |
| `/estadios` | Estadios |

## Configuración de entorno

La URL base del backend se configura con:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Para desarrollo local se recomienda crear un archivo `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

No se deben commitear secretos ni credenciales.

## Conexión con backend

El frontend usa un cliente Axios centralizado en:

```text
src/services/api/axiosClient.js
```

Endpoints públicos actualmente usados por la UI:

- `GET /api/matches`
- `GET /api/matches/schedule/daily?date=YYYY-MM-DD`
- `GET /api/standings`

El contrato público del frontend está documentado en:

```text
docs/api-contract.md
```

## Comandos disponibles

Instalar dependencias:

```bash
pnpm install
```

Servidor de desarrollo:

```bash
pnpm run dev
```

Build de producción:

```bash
pnpm run build
```

Lint:

```bash
pnpm run lint
```

Tests:

```bash
pnpm run test
```

Modo watch de tests:

```bash
pnpm run test:watch
```

Preview del build:

```bash
pnpm run preview
```

## Validación en WSL

El proyecto se trabaja en WSL con Node 24 y pnpm. Antes de validar:

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

## Testing y validaciones

La suite cubre:

- renderizado de páginas principales;
- estados loading/error/empty;
- integración con MSW para endpoints públicos;
- parsing de respuestas;
- localStorage de predicciones;
- locking de predicciones;
- scoring;
- validación de inputs;
- utilidades de fechas;
- componentes compartidos.

## Documentación adicional

- `docs/task.md`: tablero de bloques y checklist final.
- `docs/project-requirements.md`: alcance, restricciones y reglas del proyecto.
- `docs/api-contract.md`: contrato público consumido por el frontend.
- `docs/home.md`: documentación de Home.
- `docs/group-fixtures.md`: documentación de Fixture por grupos.
- `docs/group-standings.md`: documentación de Tabla de posiciones.
- `docs/knockout-stage.md`: documentación de Eliminatorias.
- `docs/prediction-fixture.md`: documentación de Predicciones.
- `DESIGN.md`: sistema visual y reglas de diseño.

## Estado actual

El proyecto tiene implementadas las secciones principales:

- Home.
- Fixture de grupos.
- Tabla de posiciones.
- Eliminatorias.
- Predicciones.

Bloque 8 está enfocado en documentación final, revisión técnica y preparación para GitHub/portfolio. El copy polish visible queda como subtarea opcional posterior.

## Aprendizajes y desafíos técnicos

- Separar contrato API público de endpoints administrativos.
- Mantener API logic fuera de componentes presentacionales.
- Usar Zod para tolerar y normalizar respuestas reales del backend.
- Manejar datos de la base de datos, placeholders y datos locales sin mezclarlos.
- Bloquear predicciones por estado y fecha del partido.
- Guardar predicciones localmente sin depender del backend.
- Mantener documentación por página para evitar que el task board crezca demasiado.

## Nota de portfolio

Este es un proyecto personal de portfolio inspirado en el Mundial 2026. No utiliza logos oficiales, marcas protegidas, mascota, trofeo, pelota oficial ni branding oficial FIFA. Los datos de equipos, partidos, estadios y resultados provienen del backend configurado para el proyecto.
