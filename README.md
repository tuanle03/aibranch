# 🌿 AI Branch

> AI-powered git branch name generator - Never think of a branch name again!

[![npm version](https://img.shields.io/npm/v/aibranch.svg)](https://www.npmjs.com/package/aibranch)

## 🚀 Features

- 🤖 Generate multiple branch name suggestions using AI
- 🎯 Support multiple branch types (feature/bugfix/hotfix/release)
- ⚡️ Interactive CLI with beautiful prompts
- 🔧 Configurable AI providers (OpenAI, TogetherAI, Ollama, Custom)
- 🎨 Follows naming conventions automatically
- ✅ Create and checkout branch instantly

## 📦 Installation

```bash
npm install -g aibranch
```

## 🔧 Setup

```bash
aibranch setup
```

This will guide you through:

- Selecting your AI provider
- Configuring your API key

## 💻 Usage

### Generate branch names

```bash
# In your git repository
aibranch -d "Add user authentication"
```

### Options

```bash
aibranch [options]

Options:
  -d, --description <text>    Description of what the branch is for
  -g, --generate <number>     Number of branch names to generate (default: 3)
  -t, --type <type>          Branch type (feature/bugfix/hotfix/release)
  -c, --create               Automatically create the selected branch
```

### Examples

```bash
# Generate 5 feature branch names
aibranch -g 5 -d "Implement payment gateway"

# Generate bugfix branch
aibranch -t bugfix -d "Fix login redirect issue"

# Generate and auto-create branch
aibranch -c -d "Add email notifications"
```

## 🎯 How It Works

1. Analyzes your current git context (branch, commits, changes)
2. Sends context + your description to AI
3. Generates multiple branch name suggestions
4. You select one and optionally create it

## 🤝 Contributing

Inspired by [aicommits](https://github.com/Nutlope/aicommits)

## 📄 License

MIT © tuanle03

## 🙏 Credits

- [aicommits](https://github.com/Nutlope/aicommits) - Original inspiration
- [@clack/prompts](https://github.com/natemoo-re/clack) - Beautiful CLI prompts
