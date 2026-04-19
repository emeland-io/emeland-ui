# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`emeland-ui` is a web frontend for the EmELand `modelsrv`. It serves two roles:

1. **Dashboard** for the modelsrv setup.
2. **Visual browser** for the EmELand model (repos, clusters, services, and their relationships).

The repository is currently greenfield — only `README.md` and `LICENSE` exist. There is no `package.json`, build tooling, or source code yet. Do not invent build/test/lint commands; establish them with the user when the project is scaffolded.

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

## Frontend stack & conventions

Target stack (per README): **React / Next.js, TypeScript, TailwindCSS, shadcn/ui, Radix**.

Non-obvious conventions the README commits to — follow these strictly:

- **Styling:** Tailwind classes only. Do not write custom CSS or `<style>` tags.
- **Conditional classes:** prefer the `class:` directive over ternary expressions in `className`.
- **Early returns:** use them to flatten control flow.
- **Event handlers:** name them with a `handle` prefix (`handleClick`, `handleKeyDown`).
- **Declarations:** prefer `const fn = () => …` with an explicit type over `function` declarations.
- **Accessibility is not optional:** interactive elements need `tabindex`, `aria-label`, and both click + keydown handlers where relevant.
- **Readability over micro-optimization.**
- **No placeholders:** finish what you start — no TODOs, stubs, or half-wired pieces left behind.

## Working style

- The README instructs: plan first (step-by-step / pseudocode), confirm with the user, then write code. Honor this for non-trivial features.
- If you don't know something (e.g., which operations the API actually supports), say so and check the OpenAPI spec rather than guessing.
