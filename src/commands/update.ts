import { command } from "cleye";
import { execa } from "execa";
import * as p from "@clack/prompts";
import { green, cyan, yellow } from "kolorist";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getCurrentVersion(): string {
  try {
    const packageJsonPath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  } catch {
    return "unknown";
  }
}

export const updateCommand = command(
  {
    name: "update",
    description: "Update aibranch to the latest version",
  },
  async () => {
    p.intro(cyan("🔄 Update aibranch"));

    const spinner = p.spinner();
    spinner.start("Checking for updates...");

    try {
      // Get latest version from npm
      const { stdout: latestVersion } = await execa("npm", [
        "view",
        "@tuanle03/aibranch",
        "version",
      ]);

      const currentVersion = getCurrentVersion();

      spinner.stop("Update check complete");

      if (currentVersion === latestVersion.trim()) {
        p.outro(green(`✓ Already on the latest version (${currentVersion})`));
        return;
      }

      p.note(
        `Current: ${yellow(currentVersion)}\nLatest:  ${green(
          latestVersion.trim(),
        )}`,
        "Version Info",
      );

      const shouldUpdate = await p.confirm({
        message: `Update to version ${latestVersion.trim()}?`,
      });

      if (p.isCancel(shouldUpdate) || !shouldUpdate) {
        p.cancel("Update cancelled");
        return;
      }

      const updateSpinner = p.spinner();
      updateSpinner.start("Updating aibranch...");

      // Update package
      await execa("npm", ["install", "-g", "@tuanle03/aibranch@latest"], {
        stdio: "inherit",
      });

      updateSpinner.stop("Update complete!");

      p.outro(
        green(
          `✓ Successfully updated to version ${latestVersion.trim()}\n\nRun 'aibranch --version' to verify`,
        ),
      );
    } catch (error: any) {
      spinner.stop("Update failed");
      p.cancel(error.message);
      process.exit(1);
    }
  },
);
