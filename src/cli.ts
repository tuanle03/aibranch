#!/usr/bin/env node
import { cli } from "cleye";
import { red } from "kolorist";
import { generateBranchCommand } from "./commands/generate.js";
import { setupCommand } from "./commands/setup.js";
import { configCommand } from "./commands/config.js";
import { updateCommand } from "./commands/update.js";
import { checkForUpdates, getCurrentVersion } from "./utils/version.js";

// Check for updates (async, non-blocking)
checkForUpdates();

const aibranch = cli({
  name: "aibranch",
  version: getCurrentVersion(),
  commands: [setupCommand, configCommand, updateCommand],
  flags: {
    generate: {
      type: Number,
      alias: "g",
      description: "Number of branch names to generate",
      default: 3,
    },
    description: {
      type: String,
      alias: "d",
      description: "Description of what the branch is for",
    },
    type: {
      type: String,
      alias: "t",
      description:
        "Branch type (feat/fix/docs/style/refactor/perf/test/chore/build/ci)",
      default: "feature",
    },
    create: {
      type: Boolean,
      alias: "c",
      description: "Automatically create the selected branch",
      default: false,
    },
  },
});

const { flags, command } = aibranch;

// ✨ FIXED: Only run default command if no subcommand is provided
if (!command) {
  try {
    await generateBranchCommand(flags);
  } catch (error: any) {
    console.error(red("Error:"), error.message);
    process.exit(1);
  }
}

// Note: Subcommands (setup, config, update) are automatically handled by cleye
