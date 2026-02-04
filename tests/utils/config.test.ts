import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, setConfig, getAllConfig } from '../../src/utils/config.js';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TEST_CONFIG_PATH = join(homedir(), '.aibranch.test');

describe('Config Utils', () => {
	beforeEach(() => {
		// Clean up test config file before each test
		if (existsSync(TEST_CONFIG_PATH)) {
			unlinkSync(TEST_CONFIG_PATH);
		}
	});

	afterEach(() => {
		// Clean up after tests
		if (existsSync(TEST_CONFIG_PATH)) {
			unlinkSync(TEST_CONFIG_PATH);
		}
	});

	it('should return empty object when config file does not exist', async () => {
		const config = await getConfig();
		expect(config).toEqual({});
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
