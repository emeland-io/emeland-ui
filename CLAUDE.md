# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`emeland-ui` is a web frontend for the EmELand `modelsrv`. It serves two roles:

1. **Dashboard** for the modelsrv setup.
2. **Visual browser** for the EmELand model (repos, clusters, services, and their relationships).

## Primary persona

The target user is an **alert/finding observer** (SRE or security analyst). Design flows around their core tasks:

- Triage alerts produced by sensors against EmELand filter rules.
- Drill into a finding: what matched, which entities, which filter fired, evidence trail.
- Acknowledge and perform other supported operations (snooze, escalate, assign, resolve, add notes — confirm exact set against the API spec).
- Navigate related model entities (repos, clusters, services) for context.

When in doubt about what a view should surface, ask: "what does this help the observer decide or do next?"

## API source of truth

The backend contract is defined by the EmELand OpenAPI spec:

- <https://github.com/emeland-io/openapi/tree/main/api/openapi>

Always verify endpoints, request/response shapes, and the exact set of supported operations against this spec rather than guessing. Prefer generating types/clients from the spec over hand-written interfaces.

## Frontend stack

- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">` single-file components)
- **Build tool:** Vite
- **Language:** TypeScript (strict)
- **Styling:** TailwindCSS; the design-system CSS variables live in `src/styles.css` inside `@layer components` and drive the theme switcher (`data-theme` on `<html>`)
- **Testing:** Vitest + `@vue/test-utils` (jsdom)

## Common commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check with `vue-tsc` and produce a production build
- `npm run preview` — serve the production build locally
- `npm test` — run the Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- `npm run typecheck` — `vue-tsc --noEmit`

## Code conventions (strict)

- **SFCs only.** Every component lives in a `.vue` file with `<script setup lang="ts">`. No Options API.
- **Typed props/emits.** Use `defineProps<Props>()` and `defineEmits<{ … }>()` generics — no runtime prop objects.
- **Styling:** Tailwind classes only. Do not introduce `<style>` blocks in SFCs; global theme rules belong in `src/styles.css`.
- **Conditional classes:** use Vue's `:class` object or array binding (`:class="{ active: isActive }"`) instead of ternary strings.
- **Early returns:** use them to flatten control flow.
- **Event handlers:** name them with a `handle` prefix (`handleClick`, `handleKeyDown`). Wire them with `@click` / `@keydown`.
- **Declarations:** prefer `const fn = () => …` with an explicit type over `function` declarations.
- **Accessibility is not optional:** interactive non-native elements need `tabindex="0"`, `aria-label`, and both click + keydown handlers where relevant. Use native `<button>` where possible.
- **Readability over micro-optimization.**
- **No placeholders:** finish what you start — no TODOs, stubs, or half-wired pieces left behind.

## Testing conventions

- Unit-test pure helpers in `src/lib/**`.
- Integration-test flows by mounting the root component (or the view under test) with `@vue/test-utils` `mount()` and asserting on rendered DOM + user interactions (prefer `trigger('click')` / typing into `<input>` via `setValue`).
- Reset `localStorage` and the `<html data-theme>` attribute in a `beforeEach` hook — the tweaks panel persists there.

## Authentication

Two login methods, both layered on top of a runtime config served as `/config.js`:

- **OIDC** (`oidc-client-ts`, PKCE authorization code flow) — disabled by default; enable with `config.oidc.enabled=true` and point `config.oidc.authority` at your identity provider. The UI handles the callback when the URL has `?code=…` and clears the query string afterwards.
- **Root-admin token** — break-glass path that compares a user-supplied token against `config.rootAdmin.tokenSha256`. The raw token lives only in a Kubernetes Secret; the public config only sees the hash. Treat this as recovery-only.

Role gating reads `roles` (or `groups`) from the OIDC ID token. Root-admin logins always get `roles: ["admin"]`.

`src/lib/auth.ts` owns the state and exposes `useAuth()`; tests skip the UI by calling `__setUserForTests(...)`. Users listed in `src/lib/users.ts` are a client-side mock — replace with real API calls when the admin endpoints land.

## Deployment

- `Dockerfile` — multi-stage (Node build → nginx:1.27-alpine); nginx listens on **8080** (non-root); `deploy/nginx/default.conf` enforces SPA fallback, immutable hashes on `/assets/*`, and `no-store` on `/config.js`.
- `deploy/helm/emeland-ui/` — chart that deploys the UI.
  - `templates/bootstrap.yaml` renders the **root-admin Secret and runtime ConfigMap in one pass** so both carry the same SHA-256. On first install the chart generates a `randAlphaNum(tokenLength)` token; on upgrades it reuses the existing value via `lookup` (idempotent).
  - Retrieve the generated token:
    ```sh
    kubectl -n <ns> get secret <release>-emeland-ui-root-admin \
      -o jsonpath='{.data.token}' | base64 -d
    ```
  - Override permanently with `--set rootAdmin.tokenOverride=…` or bring your own Secret via `--set rootAdmin.existingSecret=…`.
  - `helm lint` and `helm template` are green on default values and on the overrides shown in `NOTES.txt`.

## Working style

- The README instructs: plan first (step-by-step / pseudocode), confirm with the user, then write code. Honor this for non-trivial features.
- If you don't know something (e.g., which operations the API actually supports), say so and check the OpenAPI spec rather than guessing.
