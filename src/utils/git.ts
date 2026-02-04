import { execa } from "execa";

export const getGitDiff = async () => {
  try {
    const { stdout } = await execa("git", ["diff", "--cached"]);
    return stdout;
  } catch {
    const { stdout } = await execa("git", ["diff"]);
    return stdout;
  }
};

export const getGitStatus = async () => {
  const { stdout } = await execa("git", ["status", "--short"]);
  return stdout;
};

export const getCurrentBranch = async () => {
  const { stdout } = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout;
};

export const getRecentCommits = async (count = 5) => {
  const { stdout } = await execa("git", [
    "log",
    `-${count}`,
    "--pretty=format:%s",
  ]);
  return stdout.split("\n");
};

export const createBranch = async (branchName: string, checkout = true) => {
  if (checkout) {
    await execa("git", ["checkout", "-b", branchName]);
  } else {
    await execa("git", ["branch", branchName]);
  }
};

export const isGitRepository = async () => {
  try {
    await execa("git", ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
};

// Get list of changed files
export const getChangedFiles = async (): Promise<string[]> => {
  try {
    const { stdout: stagedFiles } = await execa("git", [
      "diff",
      "--cached",
      "--name-only",
    ]);

    const { stdout: unstagedFiles } = await execa("git", [
      "diff",
      "--name-only",
    ]);

    const { stdout: untrackedFiles } = await execa("git", [
      "ls-files",
      "--others",
      "--exclude-standard",
    ]);

    const allFiles = [
      ...stagedFiles.split("\n"),
      ...unstagedFiles.split("\n"),
      ...untrackedFiles.split("\n"),
    ].filter((f) => f.trim() !== "");

    return [...new Set(allFiles)];
  } catch {
    return [];
  }
};

// Better change type detection with smart analysis
export const detectChangeType = (
  files: string[],
): {
  type: string;
  confidence: "high" | "medium" | "low";
} | null => {
  if (files.length === 0) return null;

  const counts = {
    docs: 0,
    test: 0,
    config: 0,
    style: 0,
    ci: 0,
    src: 0,
  };

  const patterns = {
    docs: /\.(md|txt|pdf|doc|docx)$/i,
    test: /\.(test|spec)\.(ts|js|tsx|jsx)$|^tests?\//i,
    config:
      /^(package\.json|package-lock\.json|tsconfig\.json|\..*rc|.*\.config\.(ts|js))$/i,
    style: /\.(css|scss|sass|less|styl)$/i,
    ci: /^\.github\/workflows\//i,
    src: /^src\/.*\.(ts|js|tsx|jsx)$/i,
  };

  files.forEach((file) => {
    if (patterns.docs.test(file)) counts.docs++;
    if (patterns.test.test(file)) counts.test++;
    if (patterns.config.test(file)) counts.config++;
    if (patterns.style.test(file)) counts.style++;
    if (patterns.ci.test(file)) counts.ci++;
    if (patterns.src.test(file)) counts.src++;
  });

  const total = files.length;

  // High confidence - 100% match
  if (counts.docs === total) return { type: "docs", confidence: "high" };
  if (counts.test === total) return { type: "test", confidence: "high" };
  if (counts.ci === total) return { type: "ci", confidence: "high" };
  if (counts.style === total) return { type: "style", confidence: "high" };
  if (counts.config === total) return { type: "chore", confidence: "high" };

  // Medium confidence - majority match (>70%)
  if (counts.docs / total > 0.7) return { type: "docs", confidence: "medium" };
  if (counts.test / total > 0.7) return { type: "test", confidence: "medium" };
  if (counts.ci / total > 0.7) return { type: "ci", confidence: "medium" };
  if (counts.config / total > 0.6)
    return { type: "chore", confidence: "medium" };

  // Low confidence - check for build/config files
  if (counts.config > 0 && counts.src === 0)
    return { type: "chore", confidence: "low" };

  // Default to feat for source code changes
  if (counts.src > 0) return { type: "feat", confidence: "low" };

  // If nothing matches, return feat as default
  return { type: "feat", confidence: "low" };
};

// Get file stats for smarter description
export const getFileStats = async (): Promise<{
  added: number;
  modified: number;
  deleted: number;
}> => {
  try {
    const { stdout } = await execa("git", ["diff", "--shortstat"]);
    const match = stdout.match(
      /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/,
    );

    if (match) {
      return {
        added: parseInt(match[2] || "0"),
        modified: parseInt(match[1] || "0"),
        deleted: parseInt(match[3] || "0"),
      };
    }
  } catch {}

  return { added: 0, modified: 0, deleted: 0 };
};
