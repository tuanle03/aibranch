import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import ini from 'ini';

const CONFIG_PATH = join(homedir(), '.aibranch');

const ENV_KEYS = ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL'] as const;

const clearConfig = () => {
	if (existsSync(CONFIG_PATH)) unlinkSync(CONFIG_PATH);
};

describe('config-runtime', () => {
	let savedEnv: Partial<Record<string, string>> = {};

	beforeEach(() => {
		savedEnv = {};
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
		clearConfig();
	});

	afterEach(() => {
		clearConfig();
		for (const key of ENV_KEYS) {
			if (savedEnv[key] !== undefined) {
				process.env[key] = savedEnv[key];
			} else {
				delete process.env[key];
			}
		}
	});

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
