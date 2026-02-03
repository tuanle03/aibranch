#!/usr/bin/env node
import { cli } from "cleye";
import { red } from "kolorist";
import { generateBranchCommand } from "./commands/generate.js";
import { setupCommand } from "./commands/setup.js";
import { configCommand } from "./commands/config.js";

const aibranch = cli({
  name: "aibranch",
  version: "1.0.0",
  commands: [setupCommand, configCommand],
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
      description: "Branch type (feature/bugfix/hotfix/release)",
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

// If no command, run the main branch generation
if (!command) {
  try {
    await generateBranchCommand(flags);
  } catch (error: any) {
    console.error(red("Error:"), error.message);
    process.exit(1);
  }
}
