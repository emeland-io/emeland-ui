# Scripts

Development scripts, run through their npm script entries (see `package.json`).

## api-gen.mjs — OpenAPI code generator

`api-gen.mjs` regenerates `src/api/gen/` from the
[EmELand OpenAPI spec](https://github.com/emeland-io/modelsrv/tree/main/api/openapi)
in [modelsrv](https://github.com/emeland-io/modelsrv): TypeScript wire types
(`types.gen.ts`) and zod runtime schemas (`zod.gen.ts`), produced by
[@hey-api/openapi-ts](https://heyapi.dev/) from the same source so they can
never drift apart. The spec itself is never vendored into this repo.

### Usage

```sh
npm run api:gen                          # newest spec from the modelsrv GitHub repo (main)
npm run api:gen:local -- <path>          # newest spec from a local modelsrv checkout
npm run api:gen -- --spec <url|file>     # exact spec source, no resolution
npm run api:gen -- --help
```

| Flag | Meaning |
| --- | --- |
| `--remote` (default) | List `api/openapi/` in the modelsrv repo, pick the newest `*.yaml` by the semver in its file name |
| `--local <path>` | Same newest-version pick from a local checkout. `<path>` is required — the checkout root, the spec directory, or a spec file |
| `--spec <url\|file>` | Use exactly this source |

Environment:

- `GITHUB_TOKEN` / `GH_TOKEN` — used for GitHub API calls when set.
  Anonymous calls are rate-limited to 60/hour per IP, which can bite on CI.
- `EMELAND_OAPI_SPEC` — legacy equivalent of `--spec`; flags win.

### What it writes

Three files in `src/api/gen/`, all **committed and marked generated — never
edit them by hand**, always review their diff like code:

- `types.gen.ts` — the wire types (the shapes the backend actually sends).
  Imported by the `src/api/*` modules as `… as SystemWire` etc.
- `zod.gen.ts` — the matching zod schemas. Consumed by `makeResourceApi`
  (`src/api/resource.ts`), which validates every list and detail response
  before decoding into the hand-written domain types in `src/types/`.
- `index.ts` — re-exports.

Each file starts with a provenance header: generator version, spec name and
version, source, blob sha, and the spec's last commit (sha, date, subject,
link). In `--local` mode the commit comes from the local git checkout, and
uncommitted spec changes are flagged both in the log and in the header.
Headers deliberately carry **no wall-clock timestamp**: regenerating from an
unchanged spec produces an empty diff, so a dirty diff always means the spec
(or the generator) actually changed.

### Format shim (boundary policy)

The boundary validates **shape, not string formats**. The spec's
`format: uuid` / `format: uri` / `format: date-time` would map to RFC-strict
`z.uuid()` / `z.url()` / `z.iso.datetime()`; the script rewrites them
post-generation to plain (non-empty where ids) strings, because backend ids
are not RFC-strict in practice and `z.iso.datetime()` rejects
numeric-offset timestamps (`…T00:00:00+02:00`) that common serializers emit.

If a generator upgrade changes how formats are emitted, the shim **fails
loudly** instead of silently reverting the boundary to RFC-strict
validation — update the replacements in `api-gen.mjs` when that happens.

### Updating the spec

```sh
npm run api:gen        # or --local/--spec while iterating on the spec itself
git diff src/api/gen   # review: schema changes = contract changes
npm run type-check && npm test -- --run
```

Type errors after a regen usually mean a decoder in `src/api/*` needs to
follow the contract change; test failures in `tests/api/` usually mean the
wire-format mocks in `src/mocks/` do. Commit the regenerated files together
with those adaptations.
