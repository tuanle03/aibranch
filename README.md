# 🌿 AI Branch

> AI-powered git branch name generator - Never think of a branch name again!

[![npm version](https://img.shields.io/npm/v/@tuanle03/aibranch.svg)](https://www.npmjs.com/package/@tuanle03/aibranch)
[![npm downloads](https://img.shields.io/npm/dm/@tuanle03/aibranch.svg)](https://www.npmjs.com/package/@tuanle03/aibranch)
[![CI](https://github.com/tuanle03/aibranch/actions/workflows/ci.yml/badge.svg)](https://github.com/tuanle03/aibranch/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tuanle03/aibranch/branch/main/graph/badge.svg)](https://codecov.io/gh/tuanle03/aibranch)
[![GitHub Package](https://img.shields.io/badge/GitHub-Package-blue)](https://github.com/tuanle03/aibranch/pkgs/npm/aibranch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- 🤖 **Zero-prompt workflow** - Auto-analyzes changes and generates branch names instantly, no questions asked
- 🎯 **Auto branch type** - Detects the right type (feat, fix, docs, etc.) from your file changes automatically
- ⚡️ **Consistent naming** - All suggestions use the same detected type prefix, just like aicommits
- 🔧 **Multiple AI Providers** - OpenAI, TogetherAI, Ollama, any OpenAI-compatible endpoint
- 🎨 **Interactive CLI** - Beautiful prompts powered by @clack/prompts
- ✅ **Instant Creation** - Create and checkout branch immediately

## 📦 Installation

### From npm (recommended)

```bash
npm install -g @tuanle03/aibranch
```

### From GitHub Packages

```bash
# Configure npm to use GitHub Packages
echo "@tuanle03:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install
npm install -g @tuanle03/aibranch
```

## 🔧 Setup

```bash
aibranch setup
```

This will guide you through:

- Selecting your AI provider
- Configuring your API key

## 💻 Usage

### Quick Start

```bash
# Stage your changes, then run — AI does the rest
git add .
aibranch
```

That's it. No prompts asking how to proceed or which type to use. aibranch:

1. Detects changed files and infers the branch type
2. Analyzes the diff with AI to generate a description
3. Presents branch name options — all with the same consistent type prefix
4. You pick one and it creates the branch

### Options

```bash
aibranch [options]

Options:
  -d, --description <text>    Skip AI analysis, use this description directly
  -g, --generate <number>     Number of branch names to generate (default: 3)
  -t, --type <type>           Override auto-detected type (feat/fix/docs/style/refactor/perf/test/chore/build/ci)
  -a, --all                   Stage all tracked changes before generating
  -y, --yes                   Skip confirmation and create branch immediately
  -c, --clipboard             Copy selected branch name to clipboard instead of creating
  -e, --exclude <files>       Comma-separated list of files to exclude from analysis
```

### Examples

```bash
# Auto-mode: analyze staged changes and generate branch names
git add .
aibranch

# Provide your own description (skips AI analysis step)
aibranch -d "Add user authentication"

# Force a specific type
aibranch -t fix -d "Fix login redirect issue"

# Generate 5 options
aibranch -g 5

# Stage all tracked files, generate, and create without confirmation
aibranch --all --yes

# Copy branch name to clipboard instead of checking out
aibranch --clipboard
```

## 🎯 How It Works

### Workflow (aicommits-style)

```
git add .
aibranch
  │
  ├─ Detects changed files → infers branch type (feat/fix/docs/...)
  ├─ Analyzes git diff with AI → generates a description
  ├─ Generates N branch names, all using the detected type prefix
  │
  └─ You pick one → branch created and checked out
```

No "how do you want to proceed?" prompt. No branch type selection step. Just results.

### Smart Type Detection

File patterns are matched to branch types automatically:

| Files changed | Detected type |
|---|---|
| `*.md`, `docs/**` | `docs` |
| `*.test.ts`, `*.spec.*` | `test` |
| `.github/workflows/**` | `ci` |
| `tsconfig.json`, `package.json` | `chore` |
| `src/**` | `feat` |

The detected type is used as the prefix for **all** generated branch names — no mixing of types across suggestions.

## ⚙️ Configuration

```bash
# View current config
aibranch config

# Set a value
aibranch config generate 5
aibranch config model gpt-4o
```

Available keys: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `generate`, `type`, `locale`, `max-length`, `timeout`

## 🤝 Contributing

Inspired by [aicommits](https://github.com/Nutlope/aicommits)

## 📄 License

MIT © tuanle03

## 🙏 Credits

- [aicommits](https://github.com/Nutlope/aicommits) - Original inspiration
- [@clack/prompts](https://github.com/natemoo-re/clack) - Beautiful CLI prompts
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration
