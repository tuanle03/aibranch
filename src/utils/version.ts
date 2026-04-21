import updateNotifier from "update-notifier";
import packageJson from "../../package.json";

export function checkForUpdates() {
  const notifier = updateNotifier({
    pkg: packageJson,
    updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
  });

  if (notifier.update) {
    notifier.notify({
      defer: false,
      isGlobal: true,
      message: `
┌─────────────────────────────────────────────────┐
│                                                 │
│   🎉 Update available for {packageName}         │
│                                                 │
│   {currentVersion} → {latestVersion}            │
│                                                 │
│   Run the following to update:                  │
│   npm install -g {packageName}                  │
│                                                 │
│   Changelog:                                    │
│   https://github.com/tuanle03/aibranch/releases │
│                                                 │
└─────────────────────────────────────────────────┘
    `.trim(),
    });
  }
}

export function getCurrentVersion(): string {
  return packageJson.version;
}
