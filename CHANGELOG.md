# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-04

### Added
- Comprehensive test infrastructure with Vitest
- ESLint configuration for code quality
- Prettier configuration for code formatting
- CI workflow for automated testing and linting
- Coverage reporting with Codecov
- Enhanced package.json with exports, engines, and packageManager fields
- CONTRIBUTING.md for development guidelines
- CHANGELOG.md for tracking changes

### Changed
- Updated GitHub Actions workflows to use pnpm instead of npm
- Improved tsconfig.json with better compiler options
- Enhanced package.json with additional scripts and keywords
- Updated .gitignore to properly exclude build artifacts

### Fixed
- Removed node_modules and dist from git tracking
- Fixed GitHub Actions publish workflow npm ci errors

## [1.1.0] - Previous Release

### Added
- Update command for checking new versions
- Version utility functions
- Update notifier integration

### Changed
- Improved version handling

## [1.0.0] - Initial Release

### Added
- AI-powered branch name generation
- Smart git change detection
- Support for OpenAI, TogetherAI, Ollama, and custom providers
- Configuration management
- Auto branch creation
