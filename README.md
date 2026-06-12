# EmELand User Interface

Enterprise Landscape Explorer for [EmELand](https://emeland.io), an enterprise landscape monitoring and exploration platform based on [*The Book of the Emerging Enterprise Landscape*](https://emeland.io/docs/introduction/).

The current frontend is built with Vue 3, TypeScript, TailwindCSS, Vite, Vitest, ESLint, and Prettier. It provides a visual interface for exploring systems, APIs, event pipelines, identities, offerings and observability concepts across enterprise landscapes.

> **Work in Progress:** EmELand UI is currently under active development. Features, navigation, data models and visual designs are subject to change.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm install`          | Install project dependencies    |
| `npm run dev`          | Start development server        |
| `npm run build`        | Type-check and build            |
| `npm run preview`      | Preview build locally           |
| `npm run lint`         | Run ESLint                      |
| `npm run format`       | Format code with Prettier       |
| `npm run format:check` | Check only format with Prettier |

## Environment Variables

Environment variables are loaded by Vite from `.env` files in the project root. Only variables prefixed with `VITE_` are exposed to the client.

| Variable                  | Default | Description                                        |
| ------------------------- | ------- | -------------------------------------------------- |
| `VITE_EMEL_DEV_USE_MOCKS` | `false` | Load mock data instead of calling the backend API. |

### Development

For local development without a running backend, mock data is provided in `src/mocks`. Enable it via `.env.development`:

```bash
# .env.development
VITE_EMEL_DEV_USE_MOCKS=true
```

With mocks enabled, the app loads sample findings, systems and related resources without needing a backend connection. When `VITE_EMEL_DEV_USE_MOCKS` is unset or `false`, the app fetches from backend API.

## Annotations

The frontned reads certain annotations from the model to drive display and behavior. Annotations are matchjed by their short key (the part after the last `/`), so the namespace prefix can vary without breaking the UI.

Current known keys are centralized in `src/constants/annotations.ts` and resolved via `getAnnotation()`, which ignores the namespace prefix.

| Short key     | Read from | Used for                                                 |
| ------------- | --------- | -------------------------------------------------------- |
| `detected-at` | Finding   | Timestamp shown in the list and sort oder (newest first) |

## Current Tech Stack

- Vue 3
- TypeScript
- TailwindCSS
- Vite
- Vitest
- ESLint
- Prettier