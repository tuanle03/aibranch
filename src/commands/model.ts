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
