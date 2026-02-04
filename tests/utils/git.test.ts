import { describe, it, expect } from 'vitest';
import { detectChangeType } from '../../src/utils/git.js';

describe('Git Utils', () => {
	describe('detectChangeType', () => {
		it('should detect docs changes', () => {
			const files = ['README.md', 'CONTRIBUTING.md'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('docs');
			expect(result?.confidence).toBe('high');
		});

		it('should detect test changes', () => {
			const files = ['src/utils/config.test.ts', 'tests/cli.spec.ts'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('test');
			expect(result?.confidence).toBe('high');
		});

		it('should detect config changes', () => {
			const files = ['package.json', 'tsconfig.json'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('chore');
		});

		it('should detect CI changes', () => {
			const files = ['.github/workflows/ci.yml'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('ci');
			expect(result?.confidence).toBe('high');
		});

		it('should return null for empty file list', () => {
			const result = detectChangeType([]);
			expect(result).toBeNull();
		});

		it('should detect source code changes', () => {
			const files = ['src/cli.ts', 'src/commands/generate.ts'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('feat');
		});

		it('should detect style changes', () => {
			const files = ['styles.css', 'theme.scss'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('style');
			expect(result?.confidence).toBe('high');
		});

		it('should handle mixed file types with majority docs', () => {
			const files = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'src/index.ts'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('docs');
			expect(result?.confidence).toBe('medium');
		});

		it('should default to feat for unrecognized patterns', () => {
			const files = ['random.xyz', 'unknown.abc'];
			const result = detectChangeType(files);
			expect(result?.type).toBe('feat');
			expect(result?.confidence).toBe('low');
		});
	});
});
