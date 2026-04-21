import { describe, it, expect } from 'vitest';
import { parseConfig, BRANCH_TYPES } from '../../src/utils/config-types.js';
import { KnownError } from '../../src/utils/error.js';

describe('parseConfig', () => {
	it('returns defaults for empty raw config', () => {
		const result = parseConfig({});
		expect(result.locale).toBe('en');
		expect(result.generate).toBe(3);
		expect(result.type).toBe('feat');
		expect(result['max-length']).toBe(75);
		expect(result.timeout).toBe(10000);
	});

	it('parses valid locale', () => {
		expect(parseConfig({ locale: 'ja' }).locale).toBe('ja');
		expect(parseConfig({ locale: 'pt-BR' }).locale).toBe('pt-BR');
	});

	it('throws KnownError for invalid locale', () => {
		expect(() => parseConfig({ locale: 'ja JP' })).toThrow(KnownError);
		expect(() => parseConfig({ locale: '123' })).toThrow(KnownError);
	});

	it('parses valid generate', () => {
		expect(parseConfig({ generate: '1' }).generate).toBe(1);
		expect(parseConfig({ generate: '10' }).generate).toBe(10);
	});

	it('throws KnownError for out-of-range generate', () => {
		expect(() => parseConfig({ generate: '0' })).toThrow(KnownError);
		expect(() => parseConfig({ generate: '11' })).toThrow(KnownError);
		expect(() => parseConfig({ generate: 'abc' })).toThrow(KnownError);
	});

	it('parses valid branch type', () => {
		for (const t of BRANCH_TYPES) {
			expect(parseConfig({ type: t }).type).toBe(t);
		}
	});

	it('throws KnownError for invalid branch type', () => {
		expect(() => parseConfig({ type: 'hotfix' })).toThrow(KnownError);
		expect(() => parseConfig({ type: 'FEAT' })).toThrow(KnownError);
	});

	it('parses valid max-length', () => {
		expect(parseConfig({ 'max-length': '20' })['max-length']).toBe(20);
		expect(parseConfig({ 'max-length': '100' })['max-length']).toBe(100);
	});

	it('throws KnownError for max-length below 20', () => {
		expect(() => parseConfig({ 'max-length': '19' })).toThrow(KnownError);
		expect(() => parseConfig({ 'max-length': '0' })).toThrow(KnownError);
	});

	it('parses valid timeout', () => {
		expect(parseConfig({ timeout: '500' }).timeout).toBe(500);
		expect(parseConfig({ timeout: '30000' }).timeout).toBe(30000);
	});

	it('throws KnownError for timeout below 500', () => {
		expect(() => parseConfig({ timeout: '499' })).toThrow(KnownError);
		expect(() => parseConfig({ timeout: '0' })).toThrow(KnownError);
	});

	it('passes through OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, provider', () => {
		const result = parseConfig({
			OPENAI_API_KEY: 'sk-test',
			OPENAI_BASE_URL: 'https://api.groq.com/openai/v1',
			OPENAI_MODEL: 'llama3',
			provider: 'groq',
		});
		expect(result.OPENAI_API_KEY).toBe('sk-test');
		expect(result.OPENAI_BASE_URL).toBe('https://api.groq.com/openai/v1');
		expect(result.OPENAI_MODEL).toBe('llama3');
		expect(result.provider).toBe('groq');
	});

	it('throws KnownError for truncated numeric strings like "5abc"', () => {
		expect(() => parseConfig({ generate: '5abc' })).toThrow(KnownError);
		expect(() => parseConfig({ 'max-length': '30abc' })).toThrow(KnownError);
		expect(() => parseConfig({ timeout: '1000abc' })).toThrow(KnownError);
	});

	it('throws KnownError for single-character locale', () => {
		expect(() => parseConfig({ locale: 'a' })).toThrow(KnownError);
	});

	it('normalises empty OPENAI_API_KEY string to undefined', () => {
		expect(parseConfig({ OPENAI_API_KEY: '' }).OPENAI_API_KEY).toBeUndefined();
	});

	it('throws KnownError for negative generate value', () => {
		expect(() => parseConfig({ generate: '-1' })).toThrow(KnownError);
	});
});
