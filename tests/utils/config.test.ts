import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, setConfig, getAllConfig } from '../../src/utils/config.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(homedir(), '.aibranch');

describe('Config Utils', () => {
	let originalConfig: Record<string, string> = {};

	beforeEach(async () => {
		// Backup current config if it exists
		if (existsSync(CONFIG_PATH)) {
			originalConfig = await getConfig();
		}
	});

	afterEach(async () => {
		// Clean up test keys
		if (existsSync(CONFIG_PATH)) {
			unlinkSync(CONFIG_PATH);
		}
		// Restore original config if there was one
		if (Object.keys(originalConfig).length > 0) {
			for (const [key, value] of Object.entries(originalConfig)) {
				await setConfig(key, value);
			}
		}
	});

	it('should return an object', async () => {
		const config = await getConfig();
		expect(typeof config).toBe('object');
	});

	it('should set and get config value', async () => {
		await setConfig('testKey', 'testValue');
		const config = await getConfig();
		expect(config.testKey).toBe('testValue');
	});

	it('should get all config', async () => {
		await setConfig('key1', 'value1');
		await setConfig('key2', 'value2');
		
		const config = await getAllConfig();
		expect(config).toHaveProperty('key1', 'value1');
		expect(config).toHaveProperty('key2', 'value2');
	});

	it('should overwrite existing config key', async () => {
		await setConfig('key1', 'value1');
		await setConfig('key1', 'value2');
		
		const config = await getConfig();
		expect(config.key1).toBe('value2');
	});
});
