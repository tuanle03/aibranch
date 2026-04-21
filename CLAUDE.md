# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # Build with pkgroll (outputs to dist/)
pnpm dev            # Run CLI directly via tsx (no build needed)
pnpm test           # Run all tests once
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage report
pnpm type-check     # Run tsc without emitting
pnpm lint           # ESLint on src/ and tests/
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier write
```

Run a single test file:
```bash
pnpm tsx tests/specs/<file>.ts
```

## Architecture

This is a CLI tool (`aibranch` / `aib`) that generates git branch names using AI. Published to npm as `@tuanle03/aibranch`.

**Entry point:** `src/cli.ts` — parses CLI flags via `cleye`, dispatches to subcommands or the default `generateBranchCommand`.

**Commands (`src/commands/`):**
- `generate.ts` — default command: detects git changes, optionally auto-generates a description via AI, lets user pick branch type, then calls AI to generate branch names
- `setup.ts` — interactive first-run wizard (selects provider, saves API key)
- `config.ts` — view/set individual config keys
- `update.ts` — self-update mechanism

**Utilities (`src/utils/`):**
- `ai.ts` — wraps Vercel AI SDK; uses `@ai-sdk/openai` for OpenAI and `@ai-sdk/openai-compatible` for custom/Ollama/TogetherAI endpoints
- `config.ts` — reads/writes `~/.aibranch` as an INI file (keys: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`)
- `git.ts` — git operations via `execa` (diff, status, changed files, branch creation, change-type detection)
- `prompts.ts` — prompt templates for branch name generation and description generation
- `branch-helpers.ts` — branch type selection UI and detection display
- `version.ts` — reads `package.json` version, checks npm registry for updates

**Build:** `pkgroll` bundles `src/cli.ts` → `dist/cli.mjs` + `dist/cli.d.ts`. The `dist/` directory is committed and published.

**Tests:** Vitest with `manten` framework. Specs live in `tests/specs/`. The `tests/utils/` directory contains shared test helpers.

## Code Style

- Tabs for indentation, single quotes, LF line endings
- ESM (`"type": "module"`); local imports must use `.js` extension
- TypeScript strict mode, ES2020 target, Node16 module resolution
- Files must end with a newline
