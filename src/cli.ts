#!/usr/bin/env node
import { cli } from 'cleye';
import { red, dim } from 'kolorist';
import { generateBranchCommand } from './commands/generate.js';
import { setupCommand } from './commands/setup.js';
import { configCommand } from './commands/config.js';
import { modelCommand } from './commands/model.js';
import { updateCommand } from './commands/update.js';
import { checkForUpdates, getCurrentVersion } from './utils/version.js';
import { KnownError } from './utils/error.js';

checkForUpdates();

const aibranch = cli({
	name: 'aibranch',
	version: getCurrentVersion(),
	commands: [setupCommand, configCommand, modelCommand, updateCommand],
	flags: {
		generate: {
			type: Number,
			alias: 'g',
			description: 'Number of branch names to generate',
			default: 3,
		},
		description: {
			type: String,
			alias: 'd',
			description: 'Description of what the branch is for',
		},
		type: {
			type: String,
			alias: 't',
			description: 'Branch type (feat/fix/docs/style/refactor/perf/test/build/ci/chore)',
		},
		all: {
			type: Boolean,
			alias: 'a',
			description: 'Stage all tracked changes before analysis',
			default: false,
		},
		clipboard: {
			type: Boolean,
			alias: 'c',
			description: 'Copy selected branch name to clipboard instead of creating branch',
			default: false,
		},
		yes: {
			type: Boolean,
			alias: 'y',
			description: 'Skip confirmation and auto-create the branch',
			default: false,
		},
		exclude: {
			type: String,
			alias: 'x',
			description: 'Comma-separated filenames to exclude from analysis',
		},
	},
});

const { flags, command } = aibranch;

if (!command) {
	try {
		await generateBranchCommand(flags);
	} catch (error: any) {
		if (error instanceof KnownError) {
			console.error(red('Error:'), error.message);
		} else {
			console.error(red('Unexpected error:'), error.message);
			console.error(
				dim('Please report this at https://github.com/tuanle03/aibranch/issues'),
			);
		}
		process.exit(1);
	}
}
