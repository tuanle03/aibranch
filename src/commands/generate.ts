import * as p from "@clack/prompts";
import { green, cyan, yellow, blue, gray } from "kolorist";
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
} from "../utils/git.js";
import { generateBranchNames, generateDescription } from "../utils/ai.js";
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

  // Detect changed files
  const changedFiles = await getChangedFiles();
  const hasChanges = changedFiles.length > 0;

  let description = flags.description;
  let branchType = flags.type;

  // If there are changes and no flags provided
  if (hasChanges && !description && (!flags.type || flags.type === "feature")) {
    const detection = detectChangeType(changedFiles);

    if (detection) {
      const confidenceLabel =
        detection.confidence === "high"
          ? "🎯"
          : detection.confidence === "medium"
            ? "🎲"
            : "🤔";

      p.note(
        `📁 ${changedFiles.length} file(s) changed\n${blue(
          `${confidenceLabel} Detected type: ${detection.type} (${detection.confidence} confidence)`,
        )}\n${gray(
          `Files: ${changedFiles.slice(0, 3).join(", ")}${
            changedFiles.length > 3 ? "..." : ""
          }`,
        )}`,
        "Auto-detection",
      );

      // Auto-generate or manual input?
      const mode = await p.select({
        message: "How do you want to proceed?",
        options: [
          {
            value: "auto",
            label: `🤖 Auto-generate (AI will analyze changes and create branch)`,
          },
          {
            value: "manual",
            label: "✏️  Manual input (describe changes yourself)",
          },
        ],
        initialValue: "auto",
      });

      if (p.isCancel(mode)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }

      if (mode === "auto") {
        // Let AI generate description
        const spinner = p.spinner();
        spinner.start("Analyzing changes...");

        try {
          const [diff, status, fileStats] = await Promise.all([
            getGitDiff().catch(() => ""),
            getGitStatus().catch(() => ""),
            getFileStats().catch(() => ({ added: 0, modified: 0, deleted: 0 })),
          ]);

          description = await generateDescription({
            files: changedFiles,
            diff: diff.slice(0, 2000), // Limit diff size
            status,
            fileStats,
          });

          spinner.stop("Changes analyzed!");

          p.note(
            `${green("Generated description:")}\n"${description}"`,
            "AI Analysis",
          );

          branchType = detection.type;
        } catch (error: any) {
          spinner.stop("Analysis failed");
          p.log.error(error.message);
          // Fall back to manual mode
          mode === "manual";
        }
      }
    }
  }

  // Get description if not provided (manual mode)
  if (!description) {
    description = await p.text({
      message: hasChanges
        ? "Describe your changes:"
        : "What is this branch for?",
      placeholder: hasChanges
        ? "e.g., Update authentication docs"
        : "e.g., Add user authentication feature",
    });

    if (p.isCancel(description)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }
  }

  // Get branch type if not provided
  if (!branchType || branchType === "feature") {
    branchType = await p.select({
      message: "Select branch type:",
      options: [
        { value: "feat", label: "feat - A new feature" },
        { value: "fix", label: "fix - A bug fix" },
        { value: "docs", label: "docs - Documentation only changes" },
        {
          value: "style",
          label: "style - Code style changes (formatting, etc.)",
        },
        {
          value: "refactor",
          label: "refactor - Code refactoring",
        },
        { value: "perf", label: "perf - Performance improvements" },
        { value: "test", label: "test - Adding or updating tests" },
        { value: "chore", label: "chore - Build/tooling changes" },
        { value: "build", label: "build - Build system changes" },
        { value: "ci", label: "ci - CI configuration changes" },
        { value: "custom", label: "custom - Enter custom type" },
      ],
    });

    if (p.isCancel(branchType)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (branchType === "custom") {
      branchType = await p.text({
        message: "Enter custom branch type:",
        placeholder: "e.g., hotfix, experiment",
      });

      if (p.isCancel(branchType)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }
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
${hasChanges ? `Changed Files: ${changedFiles.join(", ")}` : ""}
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
        placeholder: "feat/my-custom-branch",
      })) as string;

      if (p.isCancel(finalBranchName)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }
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
  } catch (error: any) {
    spinner.stop("Failed to generate branch names");
    p.cancel(error.message);
    process.exit(1);
  }
}
