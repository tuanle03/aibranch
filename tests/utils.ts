import path from "path";
import { execa, execaNode, type Options } from "execa";
import { type FsFixture } from "fs-fixture";

const aibranchPath = path.resolve("./dist/cli.mjs");

export const createAibranch = (fixture: FsFixture) => {
  const homeEnv = {
    HOME: fixture.path,
    USERPROFILE: fixture.path,
  };

  return (args?: string[], options?: Options) =>
    execaNode(aibranchPath, args, {
      cwd: fixture.path,
      ...options,
      extendEnv: false,
      env: {
        ...homeEnv,
        ...options?.env,
      },
      nodeOptions: [],
    });
};

export const createGit = async (cwd: string) => {
  const git = (command: string, args?: string[], options?: Options) =>
    execa("git", [command, ...(args || [])], { cwd, ...options });

  await git("init", ["--initial-branch=main"]);
  await git("config", ["user.name", "Test User"]);
  await git("config", ["user.email", "test@example.com"]);

  return git;
};
