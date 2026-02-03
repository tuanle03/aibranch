import * as p from "@clack/prompts";
import { green, cyan, yellow } from "kolorist";
import {
  isGitRepository,
  getGitDiff,
  getGitStatus,
  getCurrentBranch,
  getRecentCommits,
  createBranch,
} from "../utils/git.js";
import { generateBranchNames } from "../utils/ai.js";
import { getConfig } from "../utils/config.js";

export async function generateBranchCommand(flags: any) {
  // Check if in git repository
  if (!(await isGitRepository())) {
    p.cancel("Not a git repository!");
    process.exit(1);
  }

  // Check if config exists
  const config = await getConfig();
  if (!config.OPENAI_API_KEY) {
    p.cancel("Please run `aibranch setup` first to configure your API key");
    process.exit(1);
  }

  p.intro(cyan("🌿 AI Branch Name Generator"));

  // Get description if not provided
  let description = flags.description;
  if (!description) {
    description = await p.text({
      message: "What is this branch for?",
      placeholder: "e.g., Add user authentication feature",
    });

    if (p.isCancel(description)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }
  }

  // Get branch type if not provided
  let branchType = flags.type;
  if (!branchType || branchType === "feature") {
    branchType = await p.select({
      message: "Select branch type:",
      options: [
        { value: "feature", label: "Feature - New feature" },
        { value: "bugfix", label: "Bugfix - Bug fix" },
        { value: "hotfix", label: "Hotfix - Urgent fix" },
        { value: "release", label: "Release - Release branch" },
        { value: "custom", label: "Custom - Enter custom type" },
      ],
    });

    if (p.isCancel(branchType)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (branchType === "custom") {
      branchType = await p.text({
        message: "Enter custom branch type:",
        placeholder: "e.g., experiment, test",
      });
    }
  }

  const spinner = p.spinner();
  spinner.start("Generating branch names with AI...");

  try {
    // Gather git context
    const [diff, status, currentBranch, recentCommits] = await Promise.all([
      getGitDiff().catch(() => ""),
      getGitStatus().catch(() => ""),
      getCurrentBranch().catch(() => "main"),
      getRecentCommits().catch(() => []),
    ]);

    const context = `
Current Branch: ${currentBranch}
Recent Commits: ${recentCommits.join(", ")}
Git Status: ${status}
${diff ? `Recent Changes:\n${diff.slice(0, 1000)}` : ""}
    `.trim();

    // Generate branch names
    const branchNames = await generateBranchNames({
      context,
      description: description as string,
      type: branchType as string,
      count: flags.generate || 3,
    });

    spinner.stop("Branch names generated!");

    // Let user select
    const selectedBranch = await p.select({
      message: "Select a branch name:",
      options: [
        ...branchNames.map((name) => ({ value: name, label: name })),
        { value: "__custom__", label: yellow("✏️  Enter custom name") },
      ],
    });

    if (p.isCancel(selectedBranch)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    let finalBranchName = selectedBranch as string;

    if (selectedBranch === "__custom__") {
      finalBranchName = (await p.text({
        message: "Enter branch name:",
        placeholder: "feature/my-custom-branch",
      })) as string;
    }

    // Create branch
    const shouldCreate =
      flags.create ||
      (await p.confirm({
        message: `Create and checkout branch "${finalBranchName}"?`,
      }));

    if (p.isCancel(shouldCreate)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (shouldCreate) {
      await createBranch(finalBranchName, true);
      p.outro(green(`✓ Created and checked out branch: ${finalBranchName}`));
    } else {
      p.outro(`Branch name: ${cyan(finalBranchName)}`);
    }
  } catch (error) {
    spinner.stop("Failed to generate branch names");
    p.cancel(error.message);
    process.exit(1);
  }
}
