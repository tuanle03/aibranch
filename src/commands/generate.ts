import * as p from '@clack/prompts';
import { green, cyan, yellow } from 'kolorist';
import clipboard from 'clipboardy';
import {
	isGitRepository,
	getGitDiff,
	getGitStatus,
	getCurrentBranch,
	getRecentCommits,
	createBranch,
	getChangedFiles,
	detectChangeType,
	getFileStats,
} from '../utils/git.js';
import { generateBranchNames, generateDescription } from '../utils/ai.js';
import { getConfig } from '../utils/config-runtime.js';
import { selectBranchType, showDetectionInfo } from '../utils/branch-helpers.js';

export async function generateBranchCommand(flags: {
	generate?: number;
	description?: string;
	type?: string;
	all?: boolean;
	clipboard?: boolean;
	yes?: boolean;
	exclude?: string;
}) {
	const isHeadless = !process.stdout.isTTY;

	if (!(await isGitRepository())) {
		if (isHeadless) { process.stderr.write('Not a git repository\n'); process.exit(1); }
		p.cancel('Not a git repository!');
		process.exit(1);
	}

	const config = await getConfig();

	if (!config.OPENAI_API_KEY) {
		if (isHeadless) {
			process.stderr.write('Run `aibranch setup` first to configure your API key\n');
			process.exit(1);
		}
		p.cancel('Please run `aibranch setup` first to configure your API key');
		process.exit(1);
	}

	if (!isHeadless) p.intro(cyan('🌿 AI Branch Name Generator'));

	if (flags.all) {
		const { execa } = await import('execa');
		await execa('git', ['add', '--update']);
	}

	const excludedFiles = flags.exclude
		? flags.exclude.split(',').map((f) => f.trim())
		: [];

	let changedFiles = await getChangedFiles();
	if (excludedFiles.length > 0) {
		changedFiles = changedFiles.filter((f) => !excludedFiles.includes(f));
	}

	const hasChanges = changedFiles.length > 0;
	let description = flags.description;
	const typeFromFlag = Boolean(flags.type);
	let branchType: string = flags.type || config.type;

	if (!isHeadless && hasChanges && !description && !typeFromFlag) {
		const detection = detectChangeType(changedFiles);

		if (detection) {
			showDetectionInfo(detection, changedFiles);

			const mode = await p.select({
				message: 'How do you want to proceed?',
				options: [
					{ value: 'auto', label: '🤖 Auto-generate (AI will analyze changes)' },
					{ value: 'manual', label: '✏️  Manual input (describe changes yourself)' },
				],
				initialValue: 'auto',
			});

			if (p.isCancel(mode)) { p.cancel('Operation cancelled'); process.exit(0); }

			if (mode === 'auto') {
				const spinner = p.spinner();
				spinner.start('Analyzing changes...');

				try {
					const [diff, status, fileStats] = await Promise.all([
						getGitDiff().catch(() => ''),
						getGitStatus().catch(() => ''),
						getFileStats().catch(() => ({ added: 0, modified: 0, deleted: 0 })),
					]);

					description = await generateDescription({
						files: changedFiles,
						diff: diff.slice(0, 2000),
						status,
						fileStats,
					});

					spinner.stop('Changes analyzed!');
					p.note(`${green('Generated description:')}\n"${description}"`, 'AI Analysis');
					branchType = detection.type;
				} catch (err: any) {
					spinner.stop('Analysis failed');
					p.log.error(err.message);
				}
			}
		}
	}

	if (!description && !isHeadless) {
		description = (await p.text({
			message: hasChanges ? 'Describe your changes:' : 'What is this branch for?',
			placeholder: hasChanges
				? 'e.g., Update authentication docs'
				: 'e.g., Add user authentication feature',
		})) as string;

		if (p.isCancel(description)) { p.cancel('Operation cancelled'); process.exit(0); }
	}

	if (!isHeadless && !typeFromFlag) {
		branchType = await selectBranchType(
			hasChanges ? detectChangeType(changedFiles) || undefined : undefined,
		);
	}

	const count = flags.generate ?? config.generate;

	if (!isHeadless) {
		const spinner = p.spinner();
		spinner.start('Generating branch names with AI...');

		try {
			const [diff, status, currentBranch, recentCommits] = await Promise.all([
				getGitDiff().catch(() => ''),
				getGitStatus().catch(() => ''),
				getCurrentBranch().catch(() => 'main'),
				getRecentCommits().catch(() => []),
			]);

			const context = [
				`Current Branch: ${currentBranch}`,
				`Recent Commits: ${recentCommits.join(', ')}`,
				`Git Status: ${status}`,
				hasChanges ? `Changed Files: ${changedFiles.join(', ')}` : '',
				diff ? `Recent Changes:\n${diff.slice(0, 1000)}` : '',
			].filter(Boolean).join('\n');

			const branchNames = await generateBranchNames({
				context,
				description,
				type: branchType,
				count,
				locale: config.locale,
				maxLength: config['max-length'],
			});

			spinner.stop('Branch names generated!');

			const selectedBranch = await p.select({
				message: 'Select a branch name:',
				options: [
					...branchNames.map((name) => ({ value: name, label: name })),
					{ value: '__custom__', label: yellow('✏️  Enter custom name') },
				],
			});

			if (p.isCancel(selectedBranch)) { p.cancel('Operation cancelled'); process.exit(0); }

			let finalBranchName = selectedBranch as string;

			if (selectedBranch === '__custom__') {
				finalBranchName = (await p.text({
					message: 'Enter branch name:',
					placeholder: 'feat/my-custom-branch',
				})) as string;

				if (p.isCancel(finalBranchName)) { p.cancel('Operation cancelled'); process.exit(0); }
			}

			if (flags.clipboard) {
				await clipboard.write(finalBranchName);
				p.outro(green(`✓ Copied to clipboard: ${finalBranchName}`));
				return;
			}

			const shouldCreate = flags.yes || (await p.confirm({
				message: `Create and checkout branch "${finalBranchName}"?`,
			}));

			if (p.isCancel(shouldCreate)) { p.cancel('Operation cancelled'); process.exit(0); }

			if (shouldCreate) {
				await createBranch(finalBranchName, true);
				p.outro(green(`✓ Created and checked out branch: ${finalBranchName}`));
			} else {
				p.outro(`Branch name: ${cyan(finalBranchName)}`);
			}
		} catch (err: any) {
			spinner.stop('Failed to generate branch names');
			p.cancel(err.message);
			process.exit(1);
		}
		return;
	}

	// Headless mode: output first branch name to stdout
	const [diff, status, currentBranch, recentCommits] = await Promise.all([
		getGitDiff().catch(() => ''),
		getGitStatus().catch(() => ''),
		getCurrentBranch().catch(() => 'main'),
		getRecentCommits().catch(() => []),
	]);

	const context = [
		`Current Branch: ${currentBranch}`,
		`Recent Commits: ${recentCommits.join(', ')}`,
		`Git Status: ${status}`,
		hasChanges ? `Changed Files: ${changedFiles.join(', ')}` : '',
		diff ? `Recent Changes:\n${diff.slice(0, 1000)}` : '',
	].filter(Boolean).join('\n');

	const branchNames = await generateBranchNames({
		context,
		description,
		type: branchType,
		count: 1,
		locale: config.locale,
		maxLength: config['max-length'],
	});

	process.stdout.write(branchNames[0] + '\n');
}
