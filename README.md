# Fixture Mundial 2026 Frontend

![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)
![PNPM](https://img.shields.io/badge/PNPM-only-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS-Modules-1572B6?style=for-the-badge&logo=css&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

Frontend de portfolio para consultar el fixture del Mundial 2026, revisar tablas de posiciones, visualizar eliminatorias y guardar predicciones personales. La aplicación consume un backend existente de **Node.js + Express** y presenta la experiencia principal en español.

> Este repositorio contiene solo el frontend. No incluye una fuente de datos propia ni branding oficial FIFA.

## Tabla de contenidos

- [Vista general](#vista-general)
- [Características principales](#características-principales)
- [Manual breve de uso](#manual-breve-de-uso)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Requisitos previos](#requisitos-previos)
- [Instalación local](#instalación-local)
- [Configuración de entorno](#configuración-de-entorno)
- [Conexión con el backend](#conexión-con-el-backend)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Testing y validaciones](#testing-y-validaciones)
- [Deploy en Cloudflare Pages](#deploy-en-cloudflare-pages)
- [Documentación adicional](#documentación-adicional)
- [Estado actual](#estado-actual)
- [Nota de portfolio](#nota-de-portfolio)

## Vista general

`fixture-mundial-front` es una aplicación React + Vite creada como proyecto personal de portfolio. Su objetivo es ofrecer una interfaz clara para seguir el Mundial 2026 desde distintas vistas: partidos del día, fase de grupos, posiciones, eliminatorias y predicciones del usuario.

La app está pensada para trabajar conectada a un backend ya existente, que es la fuente de verdad para partidos, equipos, estadios, posiciones, resultados y reglas de transición.

## Características principales

- **Home con agenda diaria**: muestra partidos de hoy o la jornada más cercana con actividad.
- **Fixture por grupos**: permite elegir grupos y consultar sus partidos ordenados.
- **Tabla de posiciones**: presenta standings calculados por el backend.
- **Eliminatorias**: muestra el cuadro de knockout con placeholders cuando todavía faltan clasificados.
- **Predicciones**: permite guardar pronósticos locales y bloquear partidos iniciados o finalizados.
- **Scoring de predicciones**: compara predicciones contra resultados oficiales cuando están disponibles.
- **Estados de UI cuidados**: loading, delayed loading, error, empty state y datos válidos.
- **Arquitectura por capas**: servicios API, schemas Zod, componentes presentacionales y páginas separadas.
- **Panel admin protegido**: rutas administrativas para gestión interna cuando el backend y la sesión admin están configurados.

## Manual breve de uso

### Inicio — `/`

La pantalla inicial funciona como resumen del torneo.

- Consulta los partidos programados para el día actual.
- Si no hay partidos hoy, muestra la próxima fecha disponible.
- Presenta secciones informativas sobre qué permite hacer la aplicación.
- Sirve como punto de entrada hacia las demás páginas desde el Navbar.

### Grupos — `/grupos`

Vista enfocada en el fixture de fase de grupos.

- Selecciona un grupo desde el selector.
- Revisa los seis partidos del grupo elegido.
- Consulta equipos, fecha, estadio y marcador si el backend ya tiene resultado.
- Si un partido todavía no tiene goles, se muestra un estado vacío en lugar de inventar datos.

### Posiciones — `/posiciones`

Vista para revisar tablas por grupo.

- Muestra standings calculados por el backend.
- Permite ver posiciones, puntos y datos competitivos de cada selección.
- Indica visualmente zonas de clasificación cuando aplica.
- Incluye estados de carga, error y datos vacíos.

### Eliminatorias — `/eliminatorias`

Vista para seguir el cuadro de fase final.

- Presenta rondas de eliminación directa.
- Usa placeholders cuando los clasificados todavía no están definidos.
- Combina estructura base con datos reales recibidos desde el backend.
- Soporta resultados regulares y datos de penales cuando estén disponibles.

### Predicciones — `/predicciones`

Vista interactiva para pronósticos personales.

- Permite editar predicciones de partidos que aún no comenzaron.
- Bloquea partidos iniciados o finalizados para evitar cambios posteriores.
- Guarda las predicciones en `localStorage`.
- Calcula puntaje comparando el pronóstico con el resultado oficial cuando el backend lo informa.
- Incluye filtros, resumen y feedback para entender el estado de las predicciones.

### Rutas futuras u opcionales

Estas rutas existen como secciones futuras/opcionales y no forman parte del Navbar principal:

| Ruta | Sección | Propósito |
| --- | --- | --- |
| `/partidos` | Partidos | Centralizar todos los partidos del torneo. |
| `/equipos` | Equipos | Explorar selecciones, fichas o datos relacionados. |
| `/estadios` | Estadios | Consultar sedes, ciudades y contexto de estadios. |

### Rutas administrativas

El proyecto también incluye rutas administrativas protegidas bajo `/admin`. Están pensadas para tareas internas y requieren autenticación/configuración compatible con el backend.

## Tecnologías utilizadas

| Área | Tecnología |
| --- | --- |
| Framework UI | React 19 |
| Build tool | Vite 8 |
| Lenguaje | JavaScript con módulos ESM |
| Estilos | CSS Modules + CSS global mínimo |
| Routing | React Router DOM |
| Estado global | Redux Toolkit + React Redux |
| HTTP client | Axios |
| Validación/normalización | Zod |
| Testing | Vitest + React Testing Library |
| API mocking en tests | MSW |
| Package manager | PNPM |
| Deploy documentado | Cloudflare Pages |

### Restricciones del proyecto

Este frontend mantiene reglas técnicas intencionales:

- No TypeScript.
- No Tailwind CSS.
- No Bootstrap.
- No Material UI, Chakra UI, Styled Components, Emotion ni frameworks UI externos.
- No npm ni yarn para instalar o ejecutar scripts.
- CSS por componente mediante CSS Modules.
- Contratos de API definidos por la documentación/backend, no por suposiciones del frontend.

## Requisitos previos

- Node.js 24.x.
- PNPM disponible en el entorno Linux/WSL.
- Backend del proyecto ejecutándose o desplegado.
- Variable `VITE_API_BASE_URL` apuntando a la API.

En el entorno WSL del proyecto se espera una toolchain Linux nativa, por ejemplo:

```bash
/home/yorch/.nvm/versions/node/v24.14.0/bin/node
/home/yorch/.nvm/versions/node/v24.14.0/bin/pnpm
```

Evita ejecutar comandos del proyecto con rutas de Windows como `/mnt/c/Users/.../AppData/Roaming/npm`.

## Instalación local

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd fixture-mundial-front
```

### 2. Preparar Node en WSL

Si usas `nvm`, carga Node 24 antes de instalar o validar:

```bash
source ~/.nvm/nvm.sh
nvm use 24
```

Verifica que `node` y `pnpm` apunten a rutas Linux nativas:

```bash
which node
which pnpm
type -a node
type -a pnpm
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Crear archivo de entorno local

Crea `.env.local` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Ajusta la URL según el puerto o dominio donde esté corriendo el backend.

### 5. Ejecutar en desarrollo

```bash
pnpm run dev
```

Vite mostrará la URL local para abrir la aplicación en el navegador.

## Configuración de entorno

Variable principal:

| Variable | Requerida | Descripción | Ejemplo |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Sí | URL base del backend Node/Express. | `http://localhost:3000` |

Notas:

- No hardcodear URLs productivas dentro del código.
- No commitear secretos, tokens ni credenciales.
- Para Cloudflare Pages, configurar la misma variable desde el panel del proyecto.

## Conexión con el backend

El frontend usa un cliente Axios centralizado en:

```text
src/services/api/axiosClient.js
```

Servicios relacionados viven en carpetas específicas dentro de `src/services/`, por ejemplo:

```text
src/services/matches/
src/services/standings/
src/services/predictions/
src/services/admin/
src/services/errors/
```

Endpoints públicos documentados para la UI:

- `GET /api/matches`
- `GET /api/matches/schedule/daily?date=YYYY-MM-DD`
- `GET /api/standings`

El contrato público consumido por el frontend se documenta en:

```text
docs/api-contract.md
```

Si un campo del backend no está claro, debe aclararse en documentación/tareas antes de inventar un contrato en la UI.

## Scripts disponibles

| Comando | Uso |
| --- | --- |
| `pnpm install` | Instala dependencias. |
| `pnpm run dev` | Inicia el servidor local de Vite. |
| `pnpm run build` | Genera el build de producción en `dist/`. |
| `pnpm run preview` | Sirve localmente el build generado. |
| `pnpm run lint` | Ejecuta ESLint sobre el proyecto. |
| `pnpm run test` | Ejecuta la suite con Vitest en modo run. |
| `pnpm run test:watch` | Ejecuta Vitest en modo interactivo/watch. |

> Usar siempre `pnpm`. No usar `npm`, `npx` ni `yarn` en este proyecto.

## Estructura del proyecto

```text
src/
  app/                 # Store Redux
  assets/              # Íconos, ilustraciones y assets propios seguros
  components/          # Componentes reutilizables con CSS Modules
  constants/           # Rutas, grupos, storage keys y constantes compartidas
  data/                # Datos de soporte, como skeletons o estructuras base
  features/            # Slices de Redux
  layouts/             # Layouts públicos y administrativos
  pages/               # Páginas principales y admin
  routes/              # Configuración de React Router
  schemas/             # Validación y normalización con Zod
  services/            # Axios client, servicios API, errores y localStorage
  test/                # Setup de tests y MSW
  utils/               # Utilidades puras
```

Flujo recomendado:

1. La página maneja estado de pantalla.
2. El servicio consume backend o almacenamiento local.
3. Los schemas validan/normalizan respuestas.
4. Los componentes reciben props y renderizan UI.
5. El CSS Module del componente/página encapsula sus estilos.

## Testing y validaciones

La suite contempla validaciones como:

- renderizado de páginas principales;
- estados loading, delayed loading, error y empty;
- integración con MSW para endpoints públicos;
- parsing y normalización de respuestas;
- persistencia de predicciones en `localStorage`;
- bloqueo de predicciones;
- scoring;
- validación de inputs;
- utilidades de fechas;
- componentes compartidos.

Antes de validar en WSL:

```bash
source ~/.nvm/nvm.sh
nvm use 24
which node
which pnpm
type -a node
type -a pnpm
```

Luego ejecutar según corresponda:

```bash
pnpm run build
pnpm run lint
pnpm run test
```

## Deploy en Cloudflare Pages

Configuración recomendada:

| Campo | Valor |
| --- | --- |
| Framework preset | Vite o React/Vite |
| Build command | `pnpm run build` |
| Build output directory | `dist` |
| Root directory | raíz del repositorio |
| Production branch | `main` |

Variable de entorno en producción:

```env
VITE_API_BASE_URL=<URL_DEL_BACKEND>
```

El archivo `public/_redirects` incluye el fallback SPA:

```text
/* /index.html 200
```

Esto permite refrescar o abrir directamente rutas como `/grupos`, `/posiciones`, `/eliminatorias`, `/predicciones` y rutas admin como `/admin/login`.

Consideraciones para backend, auth y admin en producción:

- El backend debe permitir CORS desde el dominio de Cloudflare Pages.
- Si la autenticación admin usa cookies `HttpOnly` cross-site, validar `SameSite=None` y `Secure`.
- Probar manualmente login, refresh de sesión y logout desde el dominio desplegado.

## Documentación adicional

- `DESIGN.md`: sistema visual y reglas de diseño.
- `docs/task.md`: tablero de bloques, checklist y estado del proyecto.
- `docs/project-requirements.md`: alcance, restricciones y reglas generales.
- `docs/api-contract.md`: contrato público consumido por el frontend.
- `docs/home.md`: comportamiento de Home.
- `docs/group-fixtures.md`: comportamiento de Fixture por grupos.
- `docs/group-standings.md`: comportamiento de Tabla de posiciones.
- `docs/knockout-stage.md`: comportamiento de Eliminatorias.
- `docs/prediction-fixture.md`: comportamiento de Predicciones.
- `docs/admin-dashboard.md`: documentación del dashboard admin.
- `docs/admin-knockouts.md`: documentación de administración de eliminatorias.
- `docs/repository-index.md`: índice general del repositorio.

## Estado actual

Secciones principales implementadas:

- Home.
- Fixture de grupos.
- Tabla de posiciones.
- Eliminatorias.
- Predicciones.

También existe una base administrativa protegida para tareas internas. El proyecto se mantiene como portfolio personal y puede seguir evolucionando con mejoras de UI, documentación, cobertura de tests, integración backend y refinamientos de experiencia.

## Aprendizajes y desafíos técnicos

- Separar contrato API público de endpoints administrativos.
- Mantener lógica API fuera de componentes presentacionales.
- Usar Zod para tolerar y normalizar respuestas reales del backend.
- Manejar datos del backend, placeholders y datos locales sin mezclarlos.
- Bloquear predicciones por estado y fecha del partido.
- Guardar predicciones localmente sin depender del backend.
- Mantener documentación por página para evitar que el task board crezca demasiado.

## Nota de portfolio

Este es un proyecto personal de portfolio inspirado en el Mundial 2026. No utiliza logos oficiales, marcas protegidas, mascota, trofeo, pelota oficial ni branding oficial FIFA. Los datos de equipos, partidos, estadios y resultados provienen del backend configurado para el proyecto.
