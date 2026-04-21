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
