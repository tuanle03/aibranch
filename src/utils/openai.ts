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
