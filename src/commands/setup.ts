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

		const providerName = await p.select({
			message: 'Select AI provider:',
			options: providers.map((pv) => ({ value: pv.name, label: pv.label })),
		});

		if (p.isCancel(providerName)) { p.cancel('Setup cancelled'); process.exit(0); }

		const providerDef = providers.find((pv) => pv.name === providerName)!;

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

		const spinner = p.spinner();
		spinner.start('Fetching available models...');

		let models: string[] = [];
		try {
			models = await fetchModels({
				OPENAI_API_KEY: apiKey,
				OPENAI_BASE_URL: baseURL,
			} as Parameters<typeof fetchModels>[0]);
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

		const branchType = await p.select({
			message: 'Select default branch type:',
			options: BRANCH_TYPES.map((t) => ({ value: t, label: t })),
			initialValue: 'feat' as string,
		});

		if (p.isCancel(branchType)) { p.cancel('Setup cancelled'); process.exit(0); }

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
