# Mock Data

> **Development only.** This directory contains mock data for frontend development and testing. It will be replaced by real API calls to the modelsrv backend. Do not use in production.

## Contents

| File            | Types                  | References        |
| --------------- | ---------------------- | ----------------- |
| `contexts.ts`   | ContextType, Context   | —                 |
| `systems.ts`    | System, SystemInstance | contexts          |
| `apis.ts`       | Api, ApiInstance       | systems           |
| `components.ts` | Component              | systems, apis     |
| `findings.ts`   | FindingType, Finding   | contexts, systems |

## Cross-references

All mock data uses inline UUIDs. References between files are documented in comments at the top of each file listing which IDs are used from other mock files.

## Types

Mock data is authored in **wire format** — the exact shape the backend sends per the [EmELand OpenAPI spec](https://github.com/emeland-io/modelsrv/blob/main/api/openapi/EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3.yaml) in `modelsrv`: annotations as `{key, value}` entry lists, finding resources keyed by `id`, context fields `type`/`parent` (not the domain's `contextTypeId`/`parentId`). The api layer validates the mocks against the generated schemas (`src/api/gen/`) and decodes them like live responses, so mock drift fails tests by construction. Wire types come from `src/api/gen/types.gen.ts`; domain types live in `src/types/`.

## When to remove

Once the API client layer (`src/api/`) is implemented and connected to a running modelsrv instance, this directory can be deleted. Mock data may be preserved under `__tests__/fixtures/` for unit and component tests.
