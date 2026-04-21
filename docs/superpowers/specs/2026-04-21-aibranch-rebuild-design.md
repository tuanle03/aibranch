# aibranch Rebuild Design

**Date:** 2026-04-21
**Approach:** Option C — Restructure config + AI layers, extend commands incrementally

## Goal

Bring `aibranch` to feature parity with `aicommits`, adopting its architecture patterns for config validation, dynamic model selection, and UX flags. No hook feature (no clean git equivalent for branch naming).

## 1. Config Schema

Split `src/utils/config.ts` into two files.

### `src/utils/config-types.ts`

Defines all config keys, types, defaults, and validators. Throws `KnownError` on invalid values.

| Key | Type | Default | Validation |
|---|---|---|---|
| `OPENAI_API_KEY` | `string \| undefined` | `undefined` | — |
| `OPENAI_BASE_URL` | `string \| undefined` | `undefined` | valid URL format |
| `OPENAI_MODEL` | `string` | `''` | — |
| `provider` | `string \| undefined` | `undefined` | — |
| `locale` | `string` | `'en'` | letters, dashes, underscores only |
| `generate` | `number` | `3` | integer, 1–10 |
| `type` | `BranchType` | `'feat'` | one of the 10 valid branch types |
| `max-length` | `number` | `75` | integer, ≥ 20 |
| `timeout` | `number` | `10000` | integer, ≥ 500 |

`BranchType` = `feat | fix | docs | style | refactor | perf | test | build | ci | chore`

### `src/utils/config-runtime.ts`

- Reads `~/.aibranch` INI file
- Parses and validates each key against the schema in `config-types.ts`
- Merges environment variable overrides: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` from `process.env` take precedence over the config file
- Exports `getConfig(): ValidConfig` and `setConfig(key, value)` / `setConfigs(entries)`
- Replaces the old `utils/config.ts`

## 2. AI Provider Layer

### `src/utils/openai.ts` (new)

Maps provider name → base URL and exports provider definitions used by setup/model commands.

Supported providers:
- `openai` → `https://api.openai.com/v1`
- `togetherai` → `https://api.together.xyz/v1`
- `groq` → `https://api.groq.com/openai/v1`
- `ollama` → `http://localhost:11434/v1` (local, no API key required)
- `lmstudio` → `http://localhost:1234/v1` (local, no API key required)
- `custom` → user-supplied URL

### `src/utils/ai.ts` (consolidated)

Replace duplicated provider-creation logic with:

- `createProvider(config)` — internal helper, instantiates the correct `@ai-sdk` provider once
- `fetchModels(config): Promise<string[]>` — calls provider's `/models` endpoint, returns model IDs; used by `setup` and `model` commands
- `generateBranchNames(options)` — unchanged public signature, uses `createProvider()` internally
- `generateDescription(options)` — unchanged public signature, uses `createProvider()` internally

AI calls are wrapped in a `Promise.race` against the `timeout` config value, throwing a `KnownError` on expiry.

## 3. Commands

### `commands/setup.ts` (reworked)

1. Select provider from list
2. Prompt for API key (or base URL for local providers)
3. Call `fetchModels()` with credentials → present model list interactively
4. Validate config by running a test generation; cancel with `KnownError` if invalid
5. Ask for default branch `type`
6. Save all to `~/.aibranch`

### `commands/model.ts` (new)

1. Load config, validate provider is set (error if not)
2. Call `fetchModels()` → present list interactively
3. Save selected model as `OPENAI_MODEL`

### `commands/config.ts` (extended)

- `config get <key>` — unchanged; masks `OPENAI_API_KEY` and similar sensitive keys
- `config set <key>=<value>` — validates value against schema before saving; rejects invalid values with `KnownError`
- `config` (no subcommand) — displays all non-default config values

### `commands/generate.ts` (extended)

New flags (note: existing `--create/-c` flag is removed — superseded by `--yes/-y`):

| Flag | Short | Behavior |
|---|---|---|
| `--all` | `-a` | Run `git add --update` before diff analysis |
| `--clipboard` | `-c` | Copy selected branch name to clipboard instead of creating branch |
| `--yes` | `-y` | Skip "Create branch?" confirmation, auto-creates (branch name selection prompt still shown) |
| `--exclude` | `-x` | Comma-separated filenames to exclude from diff/changed-files analysis |

Config defaults applied (all overridable by flags):
- `type` from config → default branch type (skips type selection prompt if set)
- `generate` from config → number of suggestions
- `max-length` from config → passed into prompt as max branch name length
- `locale` from config → passed into prompt for language preference
- `timeout` from config → wraps AI call

**Headless mode:** when `process.stdout.isTTY === false`, skip all interactive prompts and print the first generated branch name to stdout. Requires `--description/-d` or staged changes for context.

### `commands/update.ts`

Unchanged.

## 4. New CLI Flags in `src/cli.ts`

Remove `--create/-c`. Add: `--all/-a`, `--clipboard/-c`, `--yes/-y`, `--exclude/-x`.
Register new `model` command alongside existing `setup`, `config`, `update`.

## 5. Error Handling

- `KnownError` class (extends `Error`) — user-facing errors print cleanly without stack trace
- Top-level catch in `cli.ts` differentiates `KnownError` (print message only) from unknown errors (print message + suggest filing an issue)
- Timeout errors throw `KnownError` with a helpful message pointing to the `timeout` config key

## 6. New Dependency

- `clipboardy` — cross-platform clipboard access for `--clipboard` flag

## 7. Tests

- Keep existing `tests/specs/` structure; no framework changes (Vitest + manten)
- Add unit tests for `config-types.ts`: each validator, valid and invalid inputs
- Add unit tests for `config-runtime.ts`: env var override behavior, missing config file, malformed values
- Update existing generate/git tests to reflect new flags and config defaults
