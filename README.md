# 🌿 AI Branch

> AI-powered git branch name generator - Never think of a branch name again!

[![npm version](https://img.shields.io/npm/v/@tuanle03/aibranch.svg)](https://www.npmjs.com/package/@tuanle03/aibranch)
[![npm downloads](https://img.shields.io/npm/dm/@tuanle03/aibranch.svg)](https://www.npmjs.com/package/@tuanle03/aibranch)
[![GitHub Package](https://img.shields.io/badge/GitHub-Package-blue)](https://github.com/tuanle03/aibranch/pkgs/npm/aibranch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- 🤖 **Smart Detection** - Automatically detect branch type from file changes
- 🎯 **Conventional Commits** - Follow standard types (feat, fix, docs, etc.)
- ⚡️ **Auto-Generate** - AI analyzes changes and suggests branch names
- 🔧 **Multiple AI Providers** - OpenAI, TogetherAI, Ollama, Custom
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
# If you have file changes, AI will auto-detect and suggest
aibranch

# Manual mode with description
aibranch -d "Add user authentication"

# Generate with specific type
aibranch -t feat -d "Add payment gateway"

# Auto-create branch
aibranch -c -d "Fix login bug"
```

### Options

```bash
aibranch [options]

Options:
  -d, --description <text>    Description of what the branch is for
  -g, --generate <number>     Number of branch names to generate (default: 3)
  -t, --type <type>          Branch type (feat/fix/docs/style/refactor/perf/test/chore/build/ci)
  -c, --create               Automatically create the selected branch
```

### Examples

```bash
# Auto-mode: AI detects changes and generates description
git add .
aibranch
# → 🤖 Auto-generate (AI analyzes your changes)

# Generate 5 branch names
aibranch -g 5 -d "Implement payment gateway"

# Generate bugfix branch
aibranch -t fix -d "Fix login redirect issue"

# Generate and auto-create branch
aibranch -c -d "Add email notifications"
```

## 🎯 How It Works

### Smart Detection

1. Detects file changes in your working directory
2. Analyzes file patterns to suggest branch type:
   - `.md` files → `docs`
   - `.test.ts` files → `test`
   - `.github/workflows/` → `ci`
   - `tsconfig.json` → `chore`
   - Source files → `feat`

### Auto-Generate Mode

1. Analyzes your git diff and changed files
2. Uses AI to generate a clear description
3. Suggests appropriate branch type
4. Creates multiple branch name options
5. You select and create instantly

## 🤝 Contributing

Inspired by [aicommits](https://github.com/Nutlope/aicommits)

## 📄 License

MIT © tuanle03

## 🙏 Credits

- [aicommits](https://github.com/Nutlope/aicommits) - Original inspiration
- [@clack/prompts](https://github.com/natemoo-re/clack) - Beautiful CLI prompts
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration
