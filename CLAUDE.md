# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

- Node >=22.14.0, pnpm 10.32.1 (hoisted linker via `.npmrc`)
- Env vars: see `.env.example`; at minimum set one provider key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.)

## Build

```bash
pnpm build                # full build
pnpm build:strict-smoke   # fast validation
pnpm build:docker         # container build (skips plugin-sdk DTS, Canvas A2UI)
```

## Test

```bash
pnpm test                 # full suite (vitest)
pnpm test:changed         # changed files only
pnpm test:extension <id>  # single extension
pnpm test:channels        # channel plugins
pnpm test:contracts       # contract tests
pnpm test:e2e             # Playwright E2E
```

## Lint & Check

```bash
pnpm check                # oxlint + format + tsgo + plugin contracts
pnpm lint                 # oxlint only
pnpm lint:fix             # oxlint + prettier
pnpm lint:swift           # SwiftLint (macOS/iOS)
prek run --all-files      # pre-commit hooks (detect-secrets + hygiene)
```

## Extension Boundary (quick reference)

Extensions import only from `openclaw/plugin-sdk/*` and local `api.ts` barrels. Never import `src/**` or another extension's internals. Full rules in AGENTS.md § Architecture Boundaries.

## Subdirectory Guides

- `extensions/AGENTS.md` — bundled plugin rules
- `src/plugin-sdk/AGENTS.md` — SDK contract
- `src/channels/AGENTS.md` — channel internals
- `src/plugins/AGENTS.md` — plugin system
- `src/gateway/protocol/AGENTS.md` — gateway protocol
