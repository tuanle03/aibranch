import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import ini from 'ini';
import { parseConfig, configDefaults } from './config-types.js';
import type { ValidConfig, RawConfig } from './config-types.js';

const CONFIG_PATH = join(homedir(), '.aibranch');

const readRawConfig = (): RawConfig => {
	if (!existsSync(CONFIG_PATH)) return {};
	return ini.parse(readFileSync(CONFIG_PATH, 'utf-8')) as RawConfig;
};

const applyEnvOverrides = (raw: RawConfig): RawConfig => ({
	...raw,
	...(process.env.OPENAI_API_KEY ? { OPENAI_API_KEY: process.env.OPENAI_API_KEY } : {}),
	...(process.env.OPENAI_BASE_URL ? { OPENAI_BASE_URL: process.env.OPENAI_BASE_URL } : {}),
	...(process.env.OPENAI_MODEL ? { OPENAI_MODEL: process.env.OPENAI_MODEL } : {}),
});

export async function getConfig(): Promise<ValidConfig> {
	const raw = applyEnvOverrides(readRawConfig());
	return parseConfig(raw);
}

export async function getAllConfig(): Promise<ValidConfig> {
	return getConfig();
}

export async function setConfig(key: string, value: string): Promise<void> {
	const raw = readRawConfig();
	raw[key as keyof RawConfig] = value;
	writeFileSync(CONFIG_PATH, ini.stringify(raw));
}

export async function setConfigs(entries: Partial<RawConfig>): Promise<void> {
	const raw = readRawConfig();
	Object.assign(raw, entries);
	writeFileSync(CONFIG_PATH, ini.stringify(raw));
}

export { configDefaults };
