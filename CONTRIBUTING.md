# Contributing to aibranch

Thank you for your interest in contributing! 🎉

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/tuanle03/aibranch.git
   cd aibranch
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run in development mode:
   ```bash
   pnpm dev
   ```

## Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Code Quality

```bash
# Type checking
pnpm type-check

# Lint
pnpm lint

# Format code
pnpm format
```

## Building

```bash
pnpm build
```

## Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following conventional commits
4. Write tests for your changes
5. Ensure all tests pass (`pnpm test`)
6. Push to your branch
7. Open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

## Questions?

Feel free to open an issue for any questions or concerns!
