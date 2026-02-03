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
