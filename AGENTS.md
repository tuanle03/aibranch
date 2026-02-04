# AGENTS.md

## Commands

- **Build:** `pnpm build` (uses pkgroll with minify)
- **Type check:** `pnpm type-check` (runs tsc)
- **Test all:** `pnpm test` (runs `tsx tests`)
- **Test single file:** `pnpm tsx tests/specs/<file>.ts`

## Architecture

CLI tool that generates git branch names using AI (OpenAI/Together AI or any OpenAI compatible endpoint).

- `src/cli.ts` - Main entry point using cleye for CLI parsing
- `src/commands/` - CLI subcommands (generate, config, setup)
- `src/utils/` - Shared utilities (git, ai, config, prompts, branch-helpers)
- `tests/specs/` - Test files using manten framework

## Code Style

- **Indentation:** Tabs
- **Quotes:** Single quotes
- **Line endings:** LF
- **Module system:** ESM (`"type": "module"`)
- **TypeScript:** Strict mode, ES2020 target, Node16 module resolution
- **Imports:** Use `.js` extension for local imports (ESM requirement)
- **Final newline:** Required
