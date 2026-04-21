# aibranch Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `aibranch` to match `aicommits` feature parity — typed config schema, dynamic model selection, new UX flags (`--all`, `--clipboard`, `--yes`, `--exclude`), headless mode, locale support, and a dedicated `model` command.

**Architecture:** Option C — restructure only `utils/config.ts` (split into `config-types.ts` + `config-runtime.ts`) and `utils/ai.ts` (consolidate provider duplication, add `fetchModels`), then extend commands incrementally on top of the clean foundation.

**Tech Stack:** TypeScript (strict, ESM), Vitest, manten, @ai-sdk/openai, @ai-sdk/openai-compatible, @clack/prompts, cleye, execa, ini, kolorist, clipboardy (new)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/utils/error.ts` | `KnownError` class for user-facing errors |
| Create | `src/utils/config-types.ts` | Config schema: keys, types, defaults, validators |
| Create | `src/utils/config-runtime.ts` | Read/parse/write `~/.aibranch`, env var overrides |
| Create | `src/utils/openai.ts` | Provider definitions: name → base URL mapping |
| Create | `src/commands/model.ts` | Interactive model switcher command |
| Create | `tests/utils/config-types.test.ts` | Validator unit tests |
| Create | `tests/utils/config-runtime.test.ts` | Env var override, missing file, malformed value tests |
| Modify | `src/utils/ai.ts` | Add `createProvider()`, `fetchModels()`, timeout wrapping |
| Modify | `src/utils/prompts.ts` | Add `locale` + `maxLength` params to branch name prompt |
| Modify | `src/commands/setup.ts` | Dynamic model fetch, provider validation, default type |
| Modify | `src/commands/config.ts` | Validate on `config set` |
| Modify | `src/commands/generate.ts` | New flags, headless mode, config defaults, remove `--create` |
| Modify | `src/cli.ts` | Register `model`, swap flags, update error handler |
| Modify | `tests/utils/config.test.ts` | Update imports to config-runtime |
| Delete | `src/utils/config.ts` | Replaced by config-types + config-runtime |

---

## Task 1: Add `KnownError` utility

**Files:**
- Create: `src/utils/error.ts`
- Create: `tests/utils/error.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/utils/error.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { KnownError } from '../../src/utils/error.js';

describe('KnownError', () => {
  it('is an instance of Error', () => {
    const err = new KnownError('something went wrong');
    expect(err).toBeInstanceOf(Error);
  });

  it('preserves the message', () => {
    const err = new KnownError('bad config value');
    expect(err.message).toBe('bad config value');
  });

  it('has name KnownError', () => {
    const err = new KnownError('x');
    expect(err.name).toBe('KnownError');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm test tests/utils/error.test.ts
```

Expected: FAIL — `KnownError` not found.

- [ ] **Step 3: Implement `src/utils/error.ts`**

```typescript
export class KnownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KnownError';
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm test tests/utils/error.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/error.ts tests/utils/error.test.ts
git commit -m "feat: add KnownError utility for user-facing errors"
```

---

## Task 2: Config types schema

**Files:**
- Create: `src/utils/config-types.ts`
- Create: `tests/utils/config-types.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/utils/config-types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseConfig, configDefaults, BRANCH_TYPES } from '../../src/utils/config-types.js';
import { KnownError } from '../../src/utils/error.js';

describe('parseConfig', () => {
  it('returns defaults for empty raw config', () => {
    const result = parseConfig({});
    expect(result.locale).toBe('en');
    expect(result.generate).toBe(3);
    expect(result.type).toBe('feat');
    expect(result['max-length']).toBe(75);
    expect(result.timeout).toBe(10000);
  });

  it('parses valid locale', () => {
    expect(parseConfig({ locale: 'ja' }).locale).toBe('ja');
    expect(parseConfig({ locale: 'pt-BR' }).locale).toBe('pt-BR');
  });

  it('throws KnownError for invalid locale', () => {
    expect(() => parseConfig({ locale: 'ja JP' })).toThrow(KnownError);
    expect(() => parseConfig({ locale: '123' })).toThrow(KnownError);
  });

  it('parses valid generate', () => {
    expect(parseConfig({ generate: '1' }).generate).toBe(1);
    expect(parseConfig({ generate: '10' }).generate).toBe(10);
  });

  it('throws KnownError for out-of-range generate', () => {
    expect(() => parseConfig({ generate: '0' })).toThrow(KnownError);
    expect(() => parseConfig({ generate: '11' })).toThrow(KnownError);
    expect(() => parseConfig({ generate: 'abc' })).toThrow(KnownError);
  });

  it('parses valid branch type', () => {
    for (const t of BRANCH_TYPES) {
      expect(parseConfig({ type: t }).type).toBe(t);
    }
  });

  it('throws KnownError for invalid branch type', () => {
    expect(() => parseConfig({ type: 'hotfix' })).toThrow(KnownError);
    expect(() => parseConfig({ type: 'FEAT' })).toThrow(KnownError);
  });

  it('parses valid max-length', () => {
    expect(parseConfig({ 'max-length': '20' })['max-length']).toBe(20);
    expect(parseConfig({ 'max-length': '100' })['max-length']).toBe(100);
  });

  it('throws KnownError for max-length below 20', () => {
    expect(() => parseConfig({ 'max-length': '19' })).toThrow(KnownError);
    expect(() => parseConfig({ 'max-length': '0' })).toThrow(KnownError);
  });

  it('parses valid timeout', () => {
    expect(parseConfig({ timeout: '500' }).timeout).toBe(500);
    expect(parseConfig({ timeout: '30000' }).timeout).toBe(30000);
  });

  it('throws KnownError for timeout below 500', () => {
    expect(() => parseConfig({ timeout: '499' })).toThrow(KnownError);
    expect(() => parseConfig({ timeout: '0' })).toThrow(KnownError);
  });

  it('passes through OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, provider', () => {
    const result = parseConfig({
      OPENAI_API_KEY: 'sk-test',
      OPENAI_BASE_URL: 'https://api.groq.com/openai/v1',
      OPENAI_MODEL: 'llama3',
      provider: 'groq',
    });
    expect(result.OPENAI_API_KEY).toBe('sk-test');
    expect(result.OPENAI_BASE_URL).toBe('https://api.groq.com/openai/v1');
    expect(result.OPENAI_MODEL).toBe('llama3');
    expect(result.provider).toBe('groq');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test tests/utils/config-types.test.ts
```

Expected: FAIL — `parseConfig` not found.

- [ ] **Step 3: Implement `src/utils/config-types.ts`**

```typescript
import { KnownError } from './error.js';

export const BRANCH_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor',
  'perf', 'test', 'build', 'ci', 'chore',
] as const;

export type BranchType = typeof BRANCH_TYPES[number];

export type RawConfig = {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
  provider?: string;
  locale?: string;
  generate?: string;
  type?: string;
  'max-length'?: string;
  timeout?: string;
};

export type ValidConfig = {
  OPENAI_API_KEY: string | undefined;
  OPENAI_BASE_URL: string | undefined;
  OPENAI_MODEL: string;
  provider: string | undefined;
  locale: string;
  generate: number;
  type: BranchType;
  'max-length': number;
  timeout: number;
};

export const configDefaults: ValidConfig = {
  OPENAI_API_KEY: undefined,
  OPENAI_BASE_URL: undefined,
  OPENAI_MODEL: '',
  provider: undefined,
  locale: 'en',
  generate: 3,
  type: 'feat',
  'max-length': 75,
  timeout: 10000,
};

const parseLocale = (value: string | undefined): string => {
  if (!value) return configDefaults.locale;
  if (!/^[a-zA-Z][a-zA-Z_-]*$/.test(value)) {
    throw new KnownError(
      `Invalid locale "${value}". Must contain only letters, dashes, and underscores.`,
    );
  }
  return value;
};

const parseGenerate = (value: string | undefined): number => {
  if (!value) return configDefaults.generate;
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    throw new KnownError(
      `Invalid generate "${value}". Must be an integer between 1 and 10.`,
    );
  }
  return n;
};

const parseType = (value: string | undefined): BranchType => {
  if (!value) return configDefaults.type;
  if (!BRANCH_TYPES.includes(value as BranchType)) {
    throw new KnownError(
      `Invalid type "${value}". Must be one of: ${BRANCH_TYPES.join(', ')}.`,
    );
  }
  return value as BranchType;
};

const parseMaxLength = (value: string | undefined): number => {
  if (!value) return configDefaults['max-length'];
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 20) {
    throw new KnownError(
      `Invalid max-length "${value}". Must be an integer >= 20.`,
    );
  }
  return n;
};

const parseTimeout = (value: string | undefined): number => {
  if (!value) return configDefaults.timeout;
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 500) {
    throw new KnownError(
      `Invalid timeout "${value}". Must be an integer >= 500ms.`,
    );
  }
  return n;
};

export const parseConfig = (raw: RawConfig): ValidConfig => ({
  OPENAI_API_KEY: raw.OPENAI_API_KEY || undefined,
  OPENAI_BASE_URL: raw.OPENAI_BASE_URL || undefined,
  OPENAI_MODEL: raw.OPENAI_MODEL || configDefaults.OPENAI_MODEL,
  provider: raw.provider || undefined,
  locale: parseLocale(raw.locale),
  generate: parseGenerate(raw.generate),
  type: parseType(raw.type),
  'max-length': parseMaxLength(raw['max-length']),
  timeout: parseTimeout(raw.timeout),
});
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test tests/utils/config-types.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/config-types.ts tests/utils/config-types.test.ts src/utils/error.ts
git commit -m "feat: add typed config schema with validation"
```

---

## Task 3: Config runtime (read/write/env vars)

**Files:**
- Create: `src/utils/config-runtime.ts`
- Create: `tests/utils/config-runtime.test.ts`
- Modify: `tests/utils/config.test.ts` (update imports)
- Delete: `src/utils/config.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/utils/config-runtime.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import ini from 'ini';

const CONFIG_PATH = join(homedir(), '.aibranch');

const clearConfig = () => {
  if (existsSync(CONFIG_PATH)) unlinkSync(CONFIG_PATH);
};

describe('config-runtime', () => {
  beforeEach(clearConfig);
  afterEach(clearConfig);

  it('returns defaults when no config file exists', async () => {
    const { getConfig } = await import('../../src/utils/config-runtime.js');
    const config = await getConfig();
    expect(config.locale).toBe('en');
    expect(config.generate).toBe(3);
    expect(config.type).toBe('feat');
    expect(config['max-length']).toBe(75);
    expect(config.timeout).toBe(10000);
    expect(config.OPENAI_API_KEY).toBeUndefined();
  });

  it('reads values from config file', async () => {
    writeFileSync(CONFIG_PATH, ini.stringify({ OPENAI_API_KEY: 'sk-test', locale: 'ja' }));
    const { getConfig } = await import('../../src/utils/config-runtime.js');
    const config = await getConfig();
    expect(config.OPENAI_API_KEY).toBe('sk-test');
    expect(config.locale).toBe('ja');
  });

  it('env vars override config file', async () => {
    writeFileSync(CONFIG_PATH, ini.stringify({ OPENAI_API_KEY: 'sk-from-file' }));
    process.env.OPENAI_API_KEY = 'sk-from-env';
    const { getConfig } = await import('../../src/utils/config-runtime.js');
    const config = await getConfig();
    expect(config.OPENAI_API_KEY).toBe('sk-from-env');
    delete process.env.OPENAI_API_KEY;
  });

  it('setConfig writes a single key', async () => {
    const { setConfig, getConfig } = await import('../../src/utils/config-runtime.js');
    await setConfig('locale', 'fr');
    const config = await getConfig();
    expect(config.locale).toBe('fr');
  });

  it('setConfigs writes multiple keys atomically', async () => {
    const { setConfigs, getConfig } = await import('../../src/utils/config-runtime.js');
    await setConfigs({ OPENAI_MODEL: 'gpt-4o', locale: 'de' });
    const config = await getConfig();
    expect(config.OPENAI_MODEL).toBe('gpt-4o');
    expect(config.locale).toBe('de');
  });

  it('throws KnownError for invalid value in config file', async () => {
    writeFileSync(CONFIG_PATH, ini.stringify({ generate: '99' }));
    const { getConfig } = await import('../../src/utils/config-runtime.js');
    await expect(getConfig()).rejects.toThrow('Invalid generate');
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test tests/utils/config-runtime.test.ts
```

Expected: FAIL — `config-runtime` not found.

- [ ] **Step 3: Implement `src/utils/config-runtime.ts`**

```typescript
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import ini from 'ini';
import { type RawConfig, type ValidConfig, parseConfig } from './config-types.js';

const CONFIG_PATH = join(homedir(), '.aibranch');

const readRaw = (): RawConfig => {
  if (!existsSync(CONFIG_PATH)) return {};
  return ini.parse(readFileSync(CONFIG_PATH, 'utf-8')) as RawConfig;
};

const writeRaw = (raw: RawConfig): void => {
  writeFileSync(CONFIG_PATH, ini.stringify(raw));
};

export async function getConfig(): Promise<ValidConfig> {
  const raw = readRaw();
  if (process.env.OPENAI_API_KEY) raw.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (process.env.OPENAI_BASE_URL) raw.OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
  if (process.env.OPENAI_MODEL) raw.OPENAI_MODEL = process.env.OPENAI_MODEL;
  return parseConfig(raw);
}

export async function setConfig(key: string, value: string): Promise<void> {
  const raw = readRaw();
  (raw as Record<string, string>)[key] = value;
  writeRaw(raw);
}

export async function setConfigs(entries: Record<string, string>): Promise<void> {
  const raw = readRaw();
  Object.assign(raw, entries);
  writeRaw(raw);
}

export async function getAllConfig(): Promise<ValidConfig> {
  return getConfig();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test tests/utils/config-runtime.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Update `tests/utils/config.test.ts` to import from config-runtime**

Replace the import line in `tests/utils/config.test.ts`:

```typescript
// old:
import { getConfig, setConfig, getAllConfig } from '../../src/utils/config.js';
// new:
import { getConfig, setConfig, getAllConfig } from '../../src/utils/config-runtime.js';
```

- [ ] **Step 6: Run the old config tests to confirm they still pass**

```bash
pnpm test tests/utils/config.test.ts
```

Expected: all tests PASS.

- [ ] **Step 7: Update all imports of `config.js` in src/ to use `config-runtime.js`**

In each file below, replace the config import:

- `src/utils/ai.ts`: `from './config.js'` → `from './config-runtime.js'`
- `src/commands/setup.ts`: `from '../utils/config.js'` → `from '../utils/config-runtime.js'`
- `src/commands/config.ts`: `from '../utils/config.js'` → `from '../utils/config-runtime.js'`
- `src/commands/generate.ts`: `from '../utils/config.js'` → `from '../utils/config-runtime.js'`

- [ ] **Step 8: Delete `src/utils/config.ts`**

```bash
rm src/utils/config.ts
```

- [ ] **Step 9: Run full test suite to confirm nothing is broken**

```bash
pnpm type-check && pnpm test
```

Expected: all tests PASS, no type errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: split config into config-types + config-runtime with env var overrides"
```

---

## Task 4: Provider definitions

**Files:**
- Create: `src/utils/openai.ts`

- [ ] **Step 1: Create `src/utils/openai.ts`**

```typescript
export type ProviderDefinition = {
  name: string;
  label: string;
  baseURL: string;
  requiresApiKey: boolean;
};

export const providers: ProviderDefinition[] = [
  {
    name: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
  },
  {
    name: 'togetherai',
    label: 'TogetherAI (recommended)',
    baseURL: 'https://api.together.xyz/v1',
    requiresApiKey: true,
  },
  {
    name: 'groq',
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
  },
  {
    name: 'ollama',
    label: 'Ollama (local)',
    baseURL: 'http://localhost:11434/v1',
    requiresApiKey: false,
  },
  {
    name: 'lmstudio',
    label: 'LM Studio (local)',
    baseURL: 'http://localhost:1234/v1',
    requiresApiKey: false,
  },
  {
    name: 'custom',
    label: 'Custom OpenAI-compatible endpoint',
    baseURL: '',
    requiresApiKey: true,
  },
];

export const getProviderDefinition = (name: string): ProviderDefinition | undefined =>
  providers.find((p) => p.name === name);
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/openai.ts
git commit -m "feat: add provider definitions for setup and model commands"
```

---

## Task 5: Consolidate AI utils

**Files:**
- Modify: `src/utils/ai.ts`

- [ ] **Step 1: Replace `src/utils/ai.ts` entirely**

```typescript
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { KnownError } from './error.js';
import { type ValidConfig } from './config-types.js';
import { getConfig } from './config-runtime.js';
import { generateBranchNamePrompt, generateDescriptionPrompt } from './prompts.js';

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1';

function createProvider(config: ValidConfig) {
  const isDefault =
    !config.OPENAI_BASE_URL || config.OPENAI_BASE_URL === OPENAI_DEFAULT_URL;
  return isDefault
    ? createOpenAI({ apiKey: config.OPENAI_API_KEY })
    : createOpenAICompatible({
        name: 'custom',
        apiKey: config.OPENAI_API_KEY,
        baseURL: config.OPENAI_BASE_URL!,
      });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new KnownError(
              `Request timed out after ${ms}ms. Increase it with: aibranch config set timeout=<ms>`,
            ),
          ),
        ms,
      ),
    ),
  ]);
}

export async function fetchModels(config: ValidConfig): Promise<string[]> {
  const baseURL = config.OPENAI_BASE_URL || OPENAI_DEFAULT_URL;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.OPENAI_API_KEY) {
    headers['Authorization'] = `Bearer ${config.OPENAI_API_KEY}`;
  }

  const response = await fetch(`${baseURL}/models`, { headers });
  if (!response.ok) {
    throw new KnownError(
      `Failed to fetch models from ${baseURL}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { data: { id: string }[] };
  return data.data.map((m) => m.id).sort();
}

export async function generateBranchNames(options: {
  context: string;
  description?: string;
  type: string;
  count: number;
  locale?: string;
  maxLength?: number;
}): Promise<string[]> {
  const config = await getConfig();

  if (!config.OPENAI_API_KEY) {
    throw new KnownError(
      'OPENAI_API_KEY not configured. Run `aibranch setup` first.',
    );
  }

  const locale = options.locale ?? config.locale;
  const maxLength = options.maxLength ?? config['max-length'];
  const provider = createProvider(config);
  const model = provider(config.OPENAI_MODEL || 'gpt-4o-mini');
  const prompt = generateBranchNamePrompt(
    options.type,
    options.description,
    options.context,
    options.count,
    locale,
    maxLength,
  );

  const { text } = await withTimeout(
    generateText({ model, prompt, temperature: 0.3, maxRetries: 2 }),
    config.timeout,
  );

  const sanitize = (line: string) =>
    line.trim().replace(/^["'`]|["'`]$/g, '').replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');

  const branches = text
    .split('\n')
    .map(sanitize)
    .filter((line) => line && line.includes('/'))
    .filter((line) => line.length <= maxLength)
    .slice(0, options.count);

  if (branches.length === 0) {
    throw new KnownError(
      'Failed to generate valid branch names. Try a different description or model.',
    );
  }

  return branches;
}

export async function generateDescription(options: {
  files: string[];
  diff: string;
  status: string;
  fileStats: { added: number; modified: number; deleted: number };
}): Promise<string> {
  const config = await getConfig();
  const provider = createProvider(config);
  const model = provider(config.OPENAI_MODEL || 'gpt-4o-mini');
  const prompt = generateDescriptionPrompt(
    options.files,
    options.diff,
    options.status,
    options.fileStats,
  );

  const { text } = await withTimeout(
    generateText({ model, prompt, temperature: 0.3, maxRetries: 2 }),
    config.timeout,
  );

  return text
    .trim()
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^-\s*/, '');
}
```

- [ ] **Step 2: Type-check and run tests**

```bash
pnpm type-check && pnpm test
```

Expected: all tests PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/ai.ts
git commit -m "refactor: consolidate AI provider creation and add fetchModels + timeout"
```

---

## Task 6: Update prompts to accept locale and maxLength

**Files:**
- Modify: `src/utils/prompts.ts`
- Modify: `tests/specs/prompt-generation.ts`

- [ ] **Step 1: Replace `generateBranchNamePrompt` in `src/utils/prompts.ts`**

```typescript
export const branchTypeDescriptions = {
  feat: 'A new feature',
  fix: 'A bug fix',
  docs: 'Documentation only changes',
  style: 'Code style changes (formatting, white-space, etc)',
  refactor: 'A code change that improves structure without changing functionality',
  perf: 'A code change that improves performance',
  test: 'Adding missing tests or correcting existing tests',
  build: 'Changes that affect the build system or external dependencies',
  ci: 'Changes to CI configuration files and scripts',
  chore: "Other changes that don't modify src or test files",
} as const;

export type BranchType = keyof typeof branchTypeDescriptions;

export const generateBranchNamePrompt = (
  type: string,
  description: string | undefined,
  context: string,
  count: number,
  locale: string = 'en',
  maxLength: number = 75,
): string => {
  const lines = [
    'You are an expert Git workflow architect.',
    '',
    'Generate Git branch names following these STRICT rules:',
    '',
    'FORMAT: <type>/<description>',
    `- type: ${type}`,
    '- description: lowercase, hyphen-separated, verb-noun structure',
    locale !== 'en' ? `- language: use ${locale} for the description words` : '',
    '',
    'EXAMPLES:',
    '  feat/add-user-authentication',
    '  fix/resolve-login-redirect-bug',
    '  docs/update-api-documentation',
    '  refactor/simplify-payment-logic',
    '',
    'CONSTRAINTS:',
    `- Maximum length: ${maxLength} characters`,
    '- No special characters except hyphens',
    '- Use imperative mood (add, fix, update)',
    '- Be specific, avoid generic terms (update, change, improve)',
    '',
    'CONTEXT:',
  ];

  if (description) {
    lines.push(`User description: ${description}`);
  }

  lines.push(`Git context:\n${context}`);
  lines.push('');
  lines.push('OUTPUT:');
  lines.push(`Generate EXACTLY ${count} unique branch names.`);
  lines.push('One per line. No numbering. No explanations. No markdown.');
  lines.push('Respond with ONLY the branch names.');

  return lines.filter((l) => l !== '').join('\n');
};

export const generateDescriptionPrompt = (
  files: string[],
  diff: string,
  status: string,
  fileStats: { added: number; modified: number; deleted: number },
): string => {
  return [
    'You are a senior code reviewer analyzing git changes.',
    '',
    'Task: Summarize the MAIN INTENTION of these changes in one sentence.',
    '',
    'RULES:',
    '- Use imperative mood (Add, Fix, Update, Remove)',
    '- Describe WHAT changed, not HOW',
    '- Be specific: mention concrete details (file names, functions, features)',
    '- Maximum 100 characters',
    '- No punctuation at the end',
    '',
    'EXAMPLES:',
    '- Add user authentication with JWT tokens',
    '- Fix memory leak in payment processor',
    '- Update API documentation for v2 endpoints',
    '- Remove deprecated logging utilities',
    '',
    'CHANGED FILES:',
    `${files.slice(0, 10).join('\n')}`,
    files.length > 10 ? `... and ${files.length - 10} more` : '',
    '',
    'FILE STATS:',
    `+${fileStats.added} -${fileStats.deleted} (${fileStats.modified} files changed)`,
    '',
    'GIT DIFF (partial):',
    diff.slice(0, 2000),
    '',
    'OUTPUT:',
    'Return ONLY the description. No quotes. No markdown. No extra text.',
  ]
    .filter(Boolean)
    .join('\n');
};
```

- [ ] **Step 2: Replace `tests/specs/prompt-generation.ts`**

```typescript
import { testSuite, expect } from 'manten';
import {
  generateBranchNamePrompt,
  generateDescriptionPrompt,
} from '../../src/utils/prompts.js';

export default testSuite(({ describe }) => {
  describe('Prompt Generation', ({ test }) => {
    test('Should generate valid branch name prompt', () => {
      const prompt = generateBranchNamePrompt(
        'feat',
        'Add login',
        'test context',
        3,
        'en',
        75,
      );

      expect(prompt).toContain('feat');
      expect(prompt).toContain('Add login');
      expect(prompt).toContain('Generate EXACTLY 3 unique branch names');
      expect(prompt).toContain('Maximum length: 75 characters');
    });

    test('Should include locale hint when locale is not en', () => {
      const prompt = generateBranchNamePrompt('feat', undefined, 'ctx', 3, 'ja', 75);
      expect(prompt).toContain('ja');
    });

    test('Should generate valid description prompt', () => {
      const prompt = generateDescriptionPrompt(
        ['src/auth.ts'],
        'diff content',
        'M  src/auth.ts',
        { added: 10, modified: 1, deleted: 5 },
      );

      expect(prompt).toContain('src/auth.ts');
      expect(prompt).toContain('+10 -5');
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/prompts.ts tests/specs/prompt-generation.ts
git commit -m "feat: add locale and maxLength params to branch name prompt"
```

---

## Task 7: Install clipboardy

**Files:**
- Modify: `package.json` (dependency added by pnpm)

- [ ] **Step 1: Install `clipboardy`**

```bash
pnpm add clipboardy
```

- [ ] **Step 2: Confirm it is importable**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add clipboardy for --clipboard flag support"
```

---

## Task 8: Rework `setup` command

**Files:**
- Modify: `src/commands/setup.ts`

- [ ] **Step 1: Replace `src/commands/setup.ts`**

```typescript
import { command } from 'cleye';
import * as p from '@clack/prompts';
import { green } from 'kolorist';
import { setConfigs } from '../utils/config-runtime.js';
import { fetchModels } from '../utils/ai.js';
import { providers } from '../utils/openai.js';
import { BRANCH_TYPES } from '../utils/config-types.js';

export const setupCommand = command(
  {
    name: 'setup',
    description: 'Configure AI provider, model, and defaults',
  },
  async () => {
    p.intro('🔧 aibranch Setup');

    // 1. Select provider
    const providerName = await p.select({
      message: 'Select AI provider:',
      options: providers.map((pv) => ({ value: pv.name, label: pv.label })),
    });

    if (p.isCancel(providerName)) { p.cancel('Setup cancelled'); process.exit(0); }

    const providerDef = providers.find((pv) => pv.name === providerName)!;

    // 2. API key or custom base URL
    let apiKey = '';
    let baseURL = providerDef.baseURL;

    if (providerName === 'custom') {
      const customURL = await p.text({
        message: 'Enter your custom API base URL:',
        placeholder: 'https://your-endpoint.com/v1',
        validate: (v) => {
          try { new URL(v); } catch { return 'Must be a valid URL'; }
        },
      });
      if (p.isCancel(customURL)) { p.cancel('Setup cancelled'); process.exit(0); }
      baseURL = customURL as string;
    }

    if (providerDef.requiresApiKey || providerName === 'custom') {
      const key = await p.text({
        message: 'Enter your API key:',
        placeholder: 'sk-...',
        validate: (v) => (!v ? 'API key is required' : undefined),
      });
      if (p.isCancel(key)) { p.cancel('Setup cancelled'); process.exit(0); }
      apiKey = key as string;
    }

    // 3. Fetch and select model
    const spinner = p.spinner();
    spinner.start('Fetching available models...');

    let models: string[] = [];
    try {
      models = await fetchModels({
        OPENAI_API_KEY: apiKey,
        OPENAI_BASE_URL: baseURL,
      } as any);
      spinner.stop(`Found ${models.length} models`);
    } catch (err: any) {
      spinner.stop('Could not fetch models');
      p.log.warn(`${err.message} — you can set the model later with: aibranch model`);
    }

    let selectedModel = '';
    if (models.length > 0) {
      const model = await p.select({
        message: 'Select a model:',
        options: models.map((m) => ({ value: m, label: m })),
      });
      if (p.isCancel(model)) { p.cancel('Setup cancelled'); process.exit(0); }
      selectedModel = model as string;
    }

    // 4. Select default branch type
    const branchType = await p.select({
      message: 'Select default branch type:',
      options: BRANCH_TYPES.map((t) => ({ value: t, label: t })),
      initialValue: 'feat' as string,
    });

    if (p.isCancel(branchType)) { p.cancel('Setup cancelled'); process.exit(0); }

    // 5. Save all
    const toSave: Record<string, string> = {
      provider: providerName as string,
      type: branchType as string,
    };
    if (apiKey) toSave.OPENAI_API_KEY = apiKey;
    if (baseURL) toSave.OPENAI_BASE_URL = baseURL;
    if (selectedModel) toSave.OPENAI_MODEL = selectedModel;

    await setConfigs(toSave);

    p.outro(green('✓ Configuration saved! Run `aibranch` to generate branch names.'));
  },
);
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/commands/setup.ts
git commit -m "feat: rework setup wizard with dynamic model fetching and default type selection"
```

---

## Task 9: Add `model` command

**Files:**
- Create: `src/commands/model.ts`

- [ ] **Step 1: Create `src/commands/model.ts`**

```typescript
import { command } from 'cleye';
import * as p from '@clack/prompts';
import { green } from 'kolorist';
import { getConfig, setConfig } from '../utils/config-runtime.js';
import { fetchModels } from '../utils/ai.js';

export const modelCommand = command(
  {
    name: 'model',
    description: 'Select or change the AI model',
  },
  async () => {
    p.intro('🤖 Select AI Model');

    const config = await getConfig();

    if (!config.OPENAI_API_KEY && !config.OPENAI_BASE_URL) {
      p.cancel('No provider configured. Run `aibranch setup` first.');
      process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start('Fetching available models...');

    let models: string[];
    try {
      models = await fetchModels(config);
      spinner.stop(`Found ${models.length} models`);
    } catch (err: any) {
      spinner.stop('Failed to fetch models');
      p.cancel(err.message);
      process.exit(1);
    }

    const selected = await p.select({
      message: 'Select a model:',
      options: models.map((m) => ({
        value: m,
        label: config.OPENAI_MODEL === m ? `${m} (current)` : m,
      })),
      initialValue: config.OPENAI_MODEL || models[0],
    });

    if (p.isCancel(selected)) { p.cancel('Cancelled'); process.exit(0); }

    await setConfig('OPENAI_MODEL', selected as string);
    p.outro(green(`✓ Model set to: ${selected}`));
  },
);
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/commands/model.ts
git commit -m "feat: add model command for interactive model selection"
```

---

## Task 10: Extend `config` command with schema validation

**Files:**
- Modify: `src/commands/config.ts`

- [ ] **Step 1: Replace `src/commands/config.ts`**

```typescript
import { command } from 'cleye';
import { cyan, dim, green, red } from 'kolorist';
import { getConfig, setConfig, getAllConfig } from '../utils/config-runtime.js';
import { parseConfig, configDefaults } from '../utils/config-types.js';
import { KnownError } from '../utils/error.js';

const getSubcommand = command(
  {
    name: 'get',
    parameters: ['<key>'],
    description: 'Get a configuration value',
  },
  async (argv) => {
    const config = await getConfig();
    const key = argv._.key as string;
    const value = (config as Record<string, unknown>)[key];

    if (value === undefined) {
      console.log(dim(`Config key "${key}" not found`));
    } else if (key.includes('KEY') || key.includes('TOKEN')) {
      console.log(dim('***' + String(value).slice(-4)));
    } else {
      console.log(value);
    }
  },
);

const setSubcommand = command(
  {
    name: 'set',
    parameters: ['<key=value>'],
    description: 'Set a configuration value',
  },
  async (argv) => {
    const params = argv._ as any;
    const param = params['key=value'] || Object.values(params)[0];

    if (!param || typeof param !== 'string') {
      console.error('Invalid format. Use: aibranch config set key=value');
      process.exit(1);
    }

    const [key, ...valueParts] = param.split('=');
    const value = valueParts.join('=');

    if (!key || value === undefined || value === '') {
      console.error('Invalid format. Use: aibranch config set key=value');
      process.exit(1);
    }

    try {
      parseConfig({ [key]: value } as any);
    } catch (err: any) {
      console.error(red('Invalid value:'), err.message);
      process.exit(1);
    }

    await setConfig(key, value);
    console.log(green(`✓ Set ${key}=${value}`));
  },
);

export const configCommand = command(
  {
    name: 'config',
    description: 'Manage configuration',
    commands: [getSubcommand, setSubcommand],
  },
  async () => {
    const config = await getAllConfig();
    const defaults = configDefaults as Record<string, unknown>;
    const configRecord = config as Record<string, unknown>;

    const nonDefault = Object.entries(configRecord).filter(
      ([k, v]) => v !== undefined && v !== '' && v !== defaults[k],
    );

    if (nonDefault.length === 0) {
      console.log(dim('No configuration found. Run `aibranch setup` first.'));
      return;
    }

    console.log(cyan('Current configuration:'));
    console.log('');

    for (const [key, value] of nonDefault) {
      if (key.includes('KEY') || key.includes('TOKEN')) {
        console.log(`  ${key}: ${dim('***' + String(value).slice(-4))}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  },
);
```

- [ ] **Step 2: Type-check and run tests**

```bash
pnpm type-check && pnpm test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/commands/config.ts
git commit -m "feat: validate config values against schema on config set"
```

---

## Task 11: Extend `generate` command with new flags and headless mode

**Files:**
- Modify: `src/commands/generate.ts`

- [ ] **Step 1: Replace `src/commands/generate.ts`**

```typescript
import * as p from '@clack/prompts';
import { green, cyan, yellow } from 'kolorist';
import clipboard from 'clipboardy';
import {
  isGitRepository,
  getGitDiff,
  getGitStatus,
  getCurrentBranch,
  getRecentCommits,
  createBranch,
  getChangedFiles,
  detectChangeType,
  getFileStats,
} from '../utils/git.js';
import { generateBranchNames, generateDescription } from '../utils/ai.js';
import { getConfig } from '../utils/config-runtime.js';
import { selectBranchType, showDetectionInfo } from '../utils/branch-helpers.js';

export async function generateBranchCommand(flags: {
  generate?: number;
  description?: string;
  type?: string;
  all?: boolean;
  clipboard?: boolean;
  yes?: boolean;
  exclude?: string;
}) {
  const isHeadless = !process.stdout.isTTY;

  if (!(await isGitRepository())) {
    if (isHeadless) { process.stderr.write('Not a git repository\n'); process.exit(1); }
    p.cancel('Not a git repository!');
    process.exit(1);
  }

  const config = await getConfig();

  if (!config.OPENAI_API_KEY) {
    if (isHeadless) {
      process.stderr.write('Run `aibranch setup` first to configure your API key\n');
      process.exit(1);
    }
    p.cancel('Please run `aibranch setup` first to configure your API key');
    process.exit(1);
  }

  if (!isHeadless) p.intro(cyan('🌿 AI Branch Name Generator'));

  // Stage all tracked changes if --all
  if (flags.all) {
    const { execa } = await import('execa');
    await execa('git', ['add', '--update']);
  }

  // Determine excluded files
  const excludedFiles = flags.exclude
    ? flags.exclude.split(',').map((f) => f.trim())
    : [];

  // Detect changes, apply exclusions
  let changedFiles = await getChangedFiles();
  if (excludedFiles.length > 0) {
    changedFiles = changedFiles.filter((f) => !excludedFiles.includes(f));
  }

  const hasChanges = changedFiles.length > 0;
  let description = flags.description;
  const typeFromFlag = Boolean(flags.type);
  let branchType: string = flags.type || config.type;

  // Auto-detection flow (interactive only, when type not forced and no description given)
  if (!isHeadless && hasChanges && !description && !typeFromFlag) {
    const detection = detectChangeType(changedFiles);

    if (detection) {
      showDetectionInfo(detection, changedFiles);

      const mode = await p.select({
        message: 'How do you want to proceed?',
        options: [
          { value: 'auto', label: '🤖 Auto-generate (AI will analyze changes)' },
          { value: 'manual', label: '✏️  Manual input (describe changes yourself)' },
        ],
        initialValue: 'auto',
      });

      if (p.isCancel(mode)) { p.cancel('Operation cancelled'); process.exit(0); }

      if (mode === 'auto') {
        const spinner = p.spinner();
        spinner.start('Analyzing changes...');

        try {
          const [diff, status, fileStats] = await Promise.all([
            getGitDiff().catch(() => ''),
            getGitStatus().catch(() => ''),
            getFileStats().catch(() => ({ added: 0, modified: 0, deleted: 0 })),
          ]);

          description = await generateDescription({
            files: changedFiles,
            diff: diff.slice(0, 2000),
            status,
            fileStats,
          });

          spinner.stop('Changes analyzed!');
          p.note(`${green('Generated description:')}\n"${description}"`, 'AI Analysis');
          branchType = detection.type;
        } catch (err: any) {
          spinner.stop('Analysis failed');
          p.log.error(err.message);
        }
      }
    }
  }

  // Manual description input (interactive only)
  if (!description && !isHeadless) {
    description = (await p.text({
      message: hasChanges ? 'Describe your changes:' : 'What is this branch for?',
      placeholder: hasChanges
        ? 'e.g., Update authentication docs'
        : 'e.g., Add user authentication feature',
    })) as string;

    if (p.isCancel(description)) { p.cancel('Operation cancelled'); process.exit(0); }
  }

  // Branch type selection (interactive, only if not set by flag)
  if (!isHeadless && !typeFromFlag) {
    branchType = await selectBranchType(
      hasChanges ? detectChangeType(changedFiles) || undefined : undefined,
    );
  }

  const count = flags.generate ?? config.generate;

  // --- Interactive mode ---
  if (!isHeadless) {
    const spinner = p.spinner();
    spinner.start('Generating branch names with AI...');

    try {
      const [diff, status, currentBranch, recentCommits] = await Promise.all([
        getGitDiff().catch(() => ''),
        getGitStatus().catch(() => ''),
        getCurrentBranch().catch(() => 'main'),
        getRecentCommits().catch(() => []),
      ]);

      const context = [
        `Current Branch: ${currentBranch}`,
        `Recent Commits: ${recentCommits.join(', ')}`,
        `Git Status: ${status}`,
        hasChanges ? `Changed Files: ${changedFiles.join(', ')}` : '',
        diff ? `Recent Changes:\n${diff.slice(0, 1000)}` : '',
      ].filter(Boolean).join('\n');

      const branchNames = await generateBranchNames({
        context,
        description,
        type: branchType,
        count,
        locale: config.locale,
        maxLength: config['max-length'],
      });

      spinner.stop('Branch names generated!');

      const selectedBranch = await p.select({
        message: 'Select a branch name:',
        options: [
          ...branchNames.map((name) => ({ value: name, label: name })),
          { value: '__custom__', label: yellow('✏️  Enter custom name') },
        ],
      });

      if (p.isCancel(selectedBranch)) { p.cancel('Operation cancelled'); process.exit(0); }

      let finalBranchName = selectedBranch as string;

      if (selectedBranch === '__custom__') {
        finalBranchName = (await p.text({
          message: 'Enter branch name:',
          placeholder: 'feat/my-custom-branch',
        })) as string;

        if (p.isCancel(finalBranchName)) { p.cancel('Operation cancelled'); process.exit(0); }
      }

      // --clipboard: copy and exit
      if (flags.clipboard) {
        await clipboard.write(finalBranchName);
        p.outro(green(`✓ Copied to clipboard: ${finalBranchName}`));
        return;
      }

      // --yes: skip confirmation
      const shouldCreate = flags.yes || (await p.confirm({
        message: `Create and checkout branch "${finalBranchName}"?`,
      }));

      if (p.isCancel(shouldCreate)) { p.cancel('Operation cancelled'); process.exit(0); }

      if (shouldCreate) {
        await createBranch(finalBranchName, true);
        p.outro(green(`✓ Created and checked out branch: ${finalBranchName}`));
      } else {
        p.outro(`Branch name: ${cyan(finalBranchName)}`);
      }
    } catch (err: any) {
      spinner.stop('Failed to generate branch names');
      p.cancel(err.message);
      process.exit(1);
    }
    return;
  }

  // --- Headless mode: output first branch name to stdout ---
  const [diff, status, currentBranch, recentCommits] = await Promise.all([
    getGitDiff().catch(() => ''),
    getGitStatus().catch(() => ''),
    getCurrentBranch().catch(() => 'main'),
    getRecentCommits().catch(() => []),
  ]);

  const context = [
    `Current Branch: ${currentBranch}`,
    `Recent Commits: ${recentCommits.join(', ')}`,
    `Git Status: ${status}`,
    hasChanges ? `Changed Files: ${changedFiles.join(', ')}` : '',
    diff ? `Recent Changes:\n${diff.slice(0, 1000)}` : '',
  ].filter(Boolean).join('\n');

  const branchNames = await generateBranchNames({
    context,
    description,
    type: branchType,
    count: 1,
    locale: config.locale,
    maxLength: config['max-length'],
  });

  process.stdout.write(branchNames[0] + '\n');
}
```

- [ ] **Step 2: Type-check and run tests**

```bash
pnpm type-check && pnpm test
```

Expected: all tests PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/commands/generate.ts
git commit -m "feat: add --all, --clipboard, --yes, --exclude flags and headless mode to generate"
```

---

## Task 12: Update `src/cli.ts`

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Replace `src/cli.ts`**

```typescript
#!/usr/bin/env node
import { cli } from 'cleye';
import { red, dim } from 'kolorist';
import { generateBranchCommand } from './commands/generate.js';
import { setupCommand } from './commands/setup.js';
import { configCommand } from './commands/config.js';
import { modelCommand } from './commands/model.js';
import { updateCommand } from './commands/update.js';
import { checkForUpdates, getCurrentVersion } from './utils/version.js';
import { KnownError } from './utils/error.js';

checkForUpdates();

const aibranch = cli({
  name: 'aibranch',
  version: getCurrentVersion(),
  commands: [setupCommand, configCommand, modelCommand, updateCommand],
  flags: {
    generate: {
      type: Number,
      alias: 'g',
      description: 'Number of branch names to generate',
      default: 3,
    },
    description: {
      type: String,
      alias: 'd',
      description: 'Description of what the branch is for',
    },
    type: {
      type: String,
      alias: 't',
      description: 'Branch type (feat/fix/docs/style/refactor/perf/test/build/ci/chore)',
    },
    all: {
      type: Boolean,
      alias: 'a',
      description: 'Stage all tracked changes before analysis',
      default: false,
    },
    clipboard: {
      type: Boolean,
      alias: 'c',
      description: 'Copy selected branch name to clipboard instead of creating branch',
      default: false,
    },
    yes: {
      type: Boolean,
      alias: 'y',
      description: 'Skip confirmation and auto-create the branch',
      default: false,
    },
    exclude: {
      type: String,
      alias: 'x',
      description: 'Comma-separated filenames to exclude from analysis',
    },
  },
});

const { flags, command } = aibranch;

if (!command) {
  try {
    await generateBranchCommand(flags);
  } catch (error: any) {
    if (error instanceof KnownError) {
      console.error(red('Error:'), error.message);
    } else {
      console.error(red('Unexpected error:'), error.message);
      console.error(
        dim('Please report this at https://github.com/tuanle03/aibranch/issues'),
      );
    }
    process.exit(1);
  }
}
```

- [ ] **Step 2: Type-check and run full test suite**

```bash
pnpm type-check && pnpm test
```

Expected: all tests PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: register model command and add all new flags to CLI entry point"
```

---

## Task 13: Final build verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: `dist/cli.mjs` produced with no errors.

- [ ] **Step 3: Smoke test the built CLI**

```bash
node dist/cli.mjs --version
node dist/cli.mjs --help
node dist/cli.mjs config --help
node dist/cli.mjs model --help
```

Expected: version printed; help shows `--all`, `--clipboard`, `--yes`, `--exclude` flags and the `model` subcommand.

- [ ] **Step 4: Commit**

```bash
git add dist/
git commit -m "build: update dist for aibranch rebuild"
```
