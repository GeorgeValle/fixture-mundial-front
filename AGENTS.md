# Agents Guide - fixture-mundial-front

## Project Identity

This project is `fixture-mundial-front`.

It is an existing React + Vite application created manually by the user.

The application is a personal portfolio project for the FIFA World Cup 2026 fixture. The backend already exists and was built with Node.js and Express.

The frontend must consume the existing backend API and follow the structure, endpoints, and behavior described in the backend documentation and uploaded project files.

## Critical Project Status

The React + Vite project already exists.

Agents must not scaffold, recreate, overwrite, or reinitialize the project.

Forbidden commands:

- `pnpm create vite`
- `npm create vite`
- `yarn create vite`
- `npm init vite`
- `vite --template`
- Any command that recreates the Vite scaffold

Agents must work inside the existing repository only.

If the project already contains files such as `package.json`, `vite.config.js`, `src/main.jsx`, or `src/App.jsx`, agents must preserve the existing project and modify it incrementally.

## Technology Stack

Required stack:

- React
- Vite
- JavaScript
- CSS Modules
- Axios
- React Router DOM
- Redux Toolkit
- React Redux
- Zod for shared-style validation schemas when needed
- Vitest
- React Testing Library
- MSW when API mocking is required
- React Hook Form only when form handling becomes necessary
- PNPM as the only package manager

Forbidden stack:

- TypeScript
- Tailwind CSS
- Bootstrap
- Material UI
- Chakra UI
- Styled Components
- Emotion
- Sass unless explicitly approved later
- UI frameworks not explicitly approved in project docs
- npm
- yarn

## Styling Rules

The project must use CSS Modules.

Each component must have its own folder.

Preferred component structure:

- `src/components/Button/Button.jsx`
- `src/components/Button/Button.module.css`

For pages:

- `src/pages/Home/Home.jsx`
- `src/pages/Home/Home.module.css`

For layouts:

- `src/layouts/MainLayout/MainLayout.jsx`
- `src/layouts/MainLayout/MainLayout.module.css`

Do not place all CSS in a single global stylesheet.

Global CSS must be minimal and reserved for reset rules, root variables, font smoothing, body defaults, and shared base styles.

Before making global visual changes, shared component visual changes, page layout redesigns, or reusable UI pattern changes, agents must read `DESIGN.md` and keep the work aligned with the documented design system.

## Language Rules

Code, folder names, function names, component names, and technical documentation should be written in English.

User-facing text inside the app may be written in Spanish, unless a task says otherwise.

Comments should be used only when they clarify non-obvious decisions.

Avoid excessive comments.

## WSL Runtime Enforcement

The user works with this project inside WSL.

Agents must assume the project path is inside Linux, for example:

- `/home/yorch/projects/apps/fixture-mundial-front`

Before running install, dev, build, test, lint, preview, or dependency commands, agents must prepare and verify the WSL runtime.

When `node` or `pnpm` is not already available from the Linux-native toolchain, Codex should load nvm first in the same shell that will run the command:

```bash
source ~/.nvm/nvm.sh
nvm use 24
```

After preparing the shell, agents must run the required verification commands:

- `which node`
- `which pnpm`
- `type -a node`
- `type -a pnpm`

The active paths from `which` must resolve to Linux-native WSL paths.

Expected active paths for this project:

- `/home/yorch/.nvm/versions/node/v24.14.0/bin/node`
- `/home/yorch/.nvm/versions/node/v24.14.0/bin/pnpm`

Other valid Linux-native examples:

- `/home/yorch/.nvm/versions/node/.../bin/node`
- `/home/yorch/.nvm/versions/node/.../bin/pnpm`

Invalid active paths:

- `/mnt/c/Users/...`
- Windows `node.exe`
- Windows `pnpm.exe`
- Any active path pointing to `AppData/Roaming/npm`

A Windows `pnpm` path appearing as a secondary result in `type -a pnpm` is acceptable only if `which pnpm` resolves first to the Linux-native pnpm path.

If `which node` or `which pnpm` resolves under `/mnt/c/`, agents must stop and report the environment issue before running install, dev, build, lint, test, preview, or dependency commands.

Agents must not run package commands when the active runtime is mixed between WSL and Windows.

## Package Manager Policy

Use PNPM only.

Allowed commands:

- `pnpm install`
- `pnpm add <package>`
- `pnpm remove <package>`
- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run test`

Forbidden commands:

- `npm install`
- `npm run`
- `npm create`
- `npx`
- `yarn`
- `yarn add`
- `corepack npm`
- Any Windows package-manager wrapper

Agents must not install dependencies unless the task explicitly requires them.

When adding dependencies, agents must explain why the dependency is needed.

## Dependency Installation Rules

The project has already been created with Vite.

Agents may install missing runtime dependencies only when needed by an approved task.

Likely frontend dependencies:

- `axios`
- `react-router-dom`
- `zod`

Optional dependencies only when needed:

- `react-hook-form`
- `@hookform/resolvers`

Do not install optional dependencies during planning.

Do not install dependencies during Plan Mode.

Do not modify dependencies without checking `package.json` first.

## Source of Truth

The backend documentation is the source of truth for:

- API endpoints
- request payloads
- response payloads
- entity names
- match structure
- team structure
- stadium structure
- group structure
- knockout structure
- validation rules
- error responses

The frontend must not invent backend contracts.

If a backend field is unclear, agents must document the uncertainty in `task.md` instead of guessing silently.

## Uploaded Data Files

The user mentioned external data files such as:

- `all matches.txt`
- `all teams.txt`
- `estadios.txt`
- `banderas enlaces.txt`

Agents must use those files only if they are available inside the project workspace or explicitly provided in the current context.

Agents must not assume OneDrive links are directly accessible from the local project.

If these files are not present locally, agents must create a clear task asking the user to place them inside a known folder such as:

- `src/data/raw/`

Recommended raw data folder:

- `src/data/raw/all-matches.txt`
- `src/data/raw/all-teams.txt`
- `src/data/raw/stadiums.txt`
- `src/data/raw/flag-links.txt`

Do not hardcode large datasets directly inside React components.

## Project Architecture

Recommended frontend structure:

- `src/main.jsx`
- `src/App.jsx`
- `src/routes/AppRoutes.jsx`
- `src/layouts/`
- `src/pages/`
- `src/components/`
- `src/services/`
- `src/schemas/`
- `src/utils/`
- `src/constants/`
- `src/assets/`
- `src/data/`

Recommended service structure:

- `src/services/api/axiosClient.js`
- `src/services/matches/matchesService.js`
- `src/services/teams/teamsService.js`
- `src/services/stadiums/stadiumsService.js`
- `src/services/errors/errorLogStorage.js`

Recommended schema structure:

- `src/schemas/matchSchema.js`
- `src/schemas/teamSchema.js`
- `src/schemas/stadiumSchema.js`
- `src/schemas/apiErrorSchema.js`

Recommended constants:

- `src/constants/routes.js`
- `src/constants/storageKeys.js`
- `src/constants/groups.js`

## Component Rules

Components must be small, readable, and focused.

A component should not directly call the backend unless it is a page-level component and the project has not yet introduced hooks or services.

Preferred flow:

- Page component handles screen state.
- Service file handles API requests.
- Schema file validates or normalizes data.
- Presentational component receives props.
- CSS Module handles styles.

Avoid mixing:

- API calls inside small UI components
- large mapping logic inside JSX
- validation logic inside JSX
- repeated endpoint strings across multiple files

## API Rules

Use Axios for backend communication.

Create a reusable Axios client.

The Axios client should support:

- base URL from environment variables
- JSON requests
- normalized error handling
- timeout if appropriate

Recommended environment variable:

- `VITE_API_BASE_URL`

Agents must not hardcode production API URLs unless the task explicitly says so.

For local development, assume the backend URL may be configured in `.env.local`.

Example expected local environment file:

- `.env.local`

Example variable name:

- `VITE_API_BASE_URL=http://localhost:3000`

Agents must not commit secrets.

## Error Handling Rules

The frontend must include centralized error management.

Errors should be user-friendly in the UI and technically useful during development.

Recommended behavior:

- Convert unknown API errors into a normalized app error.
- Show a friendly message to the user.
- Log useful technical details in development.
- Store selected error records in localStorage for debugging if required by the task.

Recommended file:

- `src/services/errors/errorLogStorage.js`

Recommended storage key:

- `fixtureMundial.errorLog`

Stored error records should avoid sensitive data.

Suggested error fields:

- `id`
- `timestamp`
- `source`
- `message`
- `status`
- `details`

Do not store full Axios response objects directly.

Do not store tokens, cookies, authorization headers, or personal sensitive data.

## Validation Rules

Backend validation is handled with Zod.

Frontend validation should also use Zod when validating API data, filters, params, forms, or user input.

For forms, prefer:

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

Do not add form libraries unless a task requires forms.

For simple selectors, filters, and route params, plain React state plus Zod validation may be enough.

## State Management Rules

Redux Toolkit is the approved global state manager.

Use Redux for:

- global UI state
- FeedbackModal state
- global loading state
- delayed loading state
- shared data needed across routes
- standings state
- knockout-stage state
- predictions state

Rules:

- Slices must not call Axios directly.
- Thunks should call service-layer functions.
- Services must use `axiosClient`.
- Redux state must remain serializable.

## Routing Rules

Use React Router DOM.

Approved primary routes:

- `/`
- `/grupos`
- `/posiciones`
- `/eliminatorias`
- `/predicciones`

Future / optional routes (not part of the main Navbar for now):

- `/partidos`
- `/equipos`
- `/estadios`

The Navbar must link only to current primary sections.

Page docs currently used as source-of-truth for core scope:

- `docs/home.md`
- `docs/group-fixtures.md`
- `docs/group-standings.md`
- `docs/knockout-stage.md`
- `docs/prediction-fixture.md`

Do not create routes that do not have a planned page or purpose.

## Main App Features

The app should support the following core features.

### Home Page

The Home page should include:

- Navbar
- A fixture-style section showing World Cup matches for today
- If there are no matches today, show the nearest upcoming match day
- Informational sections explaining what the app does
- Simple examples showing how to use the app

### Fixture Page (`/grupos`)

The Fixture page should include:

- A selector for group names
- Match cards for the selected group
- The 6 group-stage matches ordered by date
- Team logo or flag
- Team name
- Score if available
- Empty score state when goals are null or not yet available
- Stadium and date if available

### Standings Page (`/posiciones`)

The Standings page should include:

- Group standings cards
- Position columns and qualification indicators
- Clear loading, empty, and error states

### Knockout Stage Page (`/eliminatorias`)

The Knockout page should include:

- Bracket structure from the documented match range
- Placeholder teams while qualifiers are missing
- Penalty/regular score support when available

### Predictions Page (`/predicciones`)

The Predictions page should include:

- Editable predictions for matches that have not started
- Locking behavior for started/finished matches
- localStorage persistence
- Derived scoring from official backend results

### Secondary Future Pages (Optional Scope)

These pages are future/optional and should not appear in the main Navbar yet:

- Partidos (`/partidos`)
- Equipos (`/equipos`)
- Estadios (`/estadios`)

## Agent Roles

### Orchestrator Agent

Responsibilities:

- Coordinate work across agents.
- Keep tasks aligned with the project requirements.
- Avoid unnecessary scope expansion.
- Ensure no agent recreates the Vite project.
- Ensure WSL runtime rules are followed.
- Ensure `task.md` stays current.

The Orchestrator may edit planning files and documentation.

The Orchestrator should not perform large implementation changes when a specialized agent is more appropriate.

### Planner Agent

Responsibilities:

- Analyze requirements.
- Create and maintain `task.md`.
- Split work into phases.
- Identify dependencies, risks, and open questions.
- Define acceptance criteria.

Plan Mode restrictions:

- The Planner Agent must not modify application source code.
- The Planner Agent must not install packages.
- The Planner Agent must not run scaffold commands.
- The Planner Agent may update `task.md`, `agents.md`, and planning documentation.

### API Agent

Responsibilities:

- Implement API services.
- Configure Axios.
- Create data adapters.
- Create validation schemas.
- Normalize backend errors.
- Keep API logic out of presentational components.

The API Agent must not modify styling unless required for error or loading states.

### UI Agent

Responsibilities:

- Implement React pages.
- Implement reusable components.
- Implement CSS Modules.
- Build responsive layouts.
- Keep components accessible and readable.
- Preserve the project structure.

The UI Agent must not change backend contracts.

The UI Agent must not install UI frameworks.

### QA Agent

Responsibilities:

- Review completed work against `task.md`.
- Check WSL runtime compliance.
- Check package manager compliance.
- Check folder structure.
- Check CSS Module usage.
- Run available validation commands only when the environment is valid.
- Report defects clearly.

The QA Agent should provide narrowly scoped fixes instead of broad rewrites.

### Docs Agent

Responsibilities:

- Keep README documentation clear.
- Document setup steps.
- Document environment variables.
- Document project decisions.
- Document known limitations.
- Document solved problems and lessons learned.

The Docs Agent must not overstate features that are not implemented.

## Workflow

### Plan Mode

Use Plan Mode when requirements are not fully implemented.

Allowed actions:

- Inspect files.
- Read documentation.
- Update `task.md`.
- Update planning notes.
- Identify dependencies.
- Identify risks.

Forbidden actions:

- Do not write app source code.
- Do not install dependencies.
- Do not run scaffold commands.
- Do not recreate Vite.
- Do not use npm or yarn.

### Build Mode

Use Build Mode only after the plan is approved.

Allowed actions:

- Implement approved tasks.
- Add or update React components.
- Add or update CSS Modules.
- Add or update services.
- Add or update schemas.
- Add or update tests if the project has test tooling.
- Run validation commands if WSL runtime is valid.

Build Mode must follow `task.md`.

### QA Mode

Use QA Mode after implementation.

Required checks:

- Prepare the shell with `source ~/.nvm/nvm.sh` and `nvm use 24` when needed.
- `which node`
- `which pnpm`
- `type -a node`
- `type -a pnpm`
- `pnpm run build` when scripts exist and the active WSL toolchain has been verified correctly.
- `pnpm run lint` when scripts exist and the active WSL toolchain has been verified correctly.
- `pnpm run test` when scripts exist and the active WSL toolchain has been verified correctly.
- Manual review of folder structure
- Manual review of CSS Module compliance
- Manual review of forbidden dependencies

## Definition of Done

A task is done only when:

- It matches the approved scope.
- It does not recreate the Vite project.
- It uses PNPM only.
- It respects WSL runtime rules.
- It uses JavaScript, not TypeScript.
- It uses CSS Modules, not UI frameworks.
- It keeps API logic in services.
- It handles loading, error, and empty states where relevant.
- It preserves existing working behavior.
- It updates `task.md` status.
- It passes available checks or clearly documents why checks could not be run.

## Final Reminder

This repository is an existing React + Vite project.

Do not scaffold it again.

Do not replace it with a new generated project.

Work incrementally, safely, and according to `task.md`.