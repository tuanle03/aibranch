import { command } from 'cleye';
import { cyan, dim, green, red } from 'kolorist';
import { getConfig, setConfig, getAllConfig } from '../utils/config-runtime.js';
import { parseConfig, configDefaults } from '../utils/config-types.js';

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
