# emeland-ui

[![ci](https://github.com/emeland-io/emeland-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/emeland-io/emeland-ui/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/emeland-io/emeland-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/emeland-io/emeland-ui)
[![CodeFactor](https://www.codefactor.io/repository/github/emeland-io/emeland-ui/badge)](https://www.codefactor.io/repository/github/emeland-io/emeland-ui)
[![License](https://img.shields.io/github/license/emeland-io/emeland-ui)](./LICENSE)

A web front end for the EmELand modelsrv. It acts as a dashboard to your modelsrv setup as well as allowing browsing the EmELand model visually.

The emeland API spec can be found here: <https://github.com/emeland-io/openapi/tree/main/api/openapi>

## Personas

The primary user is an alert/finding observer — think SRE or security analyst — who needs to:

    -  Triage alerts produced by sensors against EmELand filter rules
    -  Drill into the finding (what matched, which entities, which filter fired, evidence trail)
    -  Acknowledge, and perform "other supported operations" (snooze, escalate, assign, resolve, add notes — to be confirmed against the spec)
    -  Navigate related model entities (repos, clusters, services) for context

## Development

```sh
npm install
npm run dev         # Vite dev server on http://localhost:5173
npm test            # Vitest suite
npm run typecheck   # vue-tsc --noEmit
npm run build       # vue-tsc + vite build → dist/
```

Runtime configuration is served as `/config.js` and sets `window.EMELAND_UI_CONFIG`. For local dev the file under `public/config.js` enables the root-admin login with the token **`dev-root-admin`** — paste that on the login screen and you're in.

To use a different token locally:

```sh
npm run dev:token                          # generate a random token, print it, patch public/config.js
npm run dev:token -- --token=my-own-token  # use a specific token
npm run dev:token:reset                    # restore the checked-in default before committing
```

Reload the browser after running the script so the new `/config.js` is picked up. Override OIDC settings at deploy time via the Helm chart's ConfigMap — **never** commit a production token hash into `public/config.js`.

## Authentication

Two login paths:

- **OIDC** (PKCE authorization code flow via `oidc-client-ts`). Enable with `config.oidc.enabled=true` and point `config.oidc.authority` at your identity provider. Role-gating reads `roles`/`groups` from the ID token.
- **Root-admin token** — a break-glass login. The raw token lives only in a Kubernetes Secret; the UI only sees a SHA-256 hash in the runtime config, so comparing the user's input client-side never leaks the secret. Use this only for recovery.

Admins see a **Users** view for managing console access (role/status/CRUD). The underlying store is a client-side mock today — replace with real API calls once the admin endpoints land.

## Deployment

A production image and Helm chart are included.

```sh
# build and push the image
docker build -t ghcr.io/emeland-io/emeland-ui:0.1.0 .
docker push ghcr.io/emeland-io/emeland-ui:0.1.0

# install the chart
helm upgrade --install emeland-ui deploy/helm/emeland-ui \
  --namespace emeland --create-namespace \
  --set config.oidc.enabled=true \
  --set config.oidc.authority=https://auth.example.com/realms/emeland \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=console.example.com

# retrieve the auto-generated root-admin token
kubectl -n emeland get secret emeland-ui-root-admin \
  -o jsonpath='{.data.token}' | base64 -d
```

The chart generates the root-admin token on first install (`randAlphaNum 48`) and reuses it across upgrades via `lookup`. Override with `--set rootAdmin.tokenOverride=…` or disable with `--set rootAdmin.enabled=false`. `helm lint` and `helm template` succeed on defaults and on the overrides above.

## Notes for Claude Code on Frontend Programming

You are a Senior Front-End Developer and an Expert in Vue 3, Vite, JavaScript, TypeScript, HTML, CSS and modern UI/UX frameworks (e.g., TailwindCSS, Headless UI, Radix Vue). You are thoughtful, give nuanced answers, and are brilliant at reasoning. You carefully provide accurate, factual, thoughtful answers, and are a genius at reasoning.

- Follow the user’s requirements carefully & to the letter.
- First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.
- Confirm, then write code!
- Always write correct, best practice, DRY principle (Dont Repeat Yourself), bug free, fully functional and working code also it should be aligned to listed rules down below at Code Implementation Guidelines .
- Focus on easy and readability code, over being performant.
- Fully implement all requested functionality.
- Leave NO todo’s, placeholders or missing pieces.
- Ensure code is complete! Verify thoroughly finalised.
- Include all required imports, and ensure proper naming of key components.
- Be concise Minimize any other prose.
- If you think there might not be a correct answer, you say so.
- If you do not know the answer, say so, instead of guessing.

### Coding Environment
The user asks questions about the following coding languages:
- Vue 3 (Single-File Components, Composition API, `<script setup lang="ts">`)
- Vite
- Pinia (for shared state when needed)
- Vue Router (when routing is needed)
- JavaScript
- TypeScript
- TailwindCSS
- HTML
- CSS

### Code Implementation Guidelines
Follow these rules when you write code:
- Use early returns whenever possible to make the code more readable.
- Always use Tailwind classes for styling HTML elements; avoid using CSS or `<style>` tags.
- Prefer Vue's object/array class binding (`:class="{ active: isActive }"`, `:class="[a, b]"`) over ternaries inline in the template.
- Use descriptive variable and function/const names. Event handlers should be named with a "handle" prefix, e.g. `handleClick` for `@click`, `handleKeyDown` for `@keydown`.
- Implement accessibility features on elements. Interactive elements need `tabindex="0"`, `aria-label`, and both `@click` and `@keydown` handlers where relevant.
- Use `const` arrow functions in `<script setup>` (e.g. `const toggle = () => { … }`). Type component props and emits explicitly using `defineProps<…>()` and `defineEmits<…>()`.
