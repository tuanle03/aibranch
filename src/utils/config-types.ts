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
