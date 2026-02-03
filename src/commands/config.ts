import { command } from "cleye";
import { cyan, dim, green } from "kolorist";
import { getConfig, setConfig, getAllConfig } from "../utils/config.js";

const getSubcommand = command(
  {
    name: "get",
    parameters: ["<key>"],
    description: "Get a configuration value",
  },
  async (argv) => {
    const config = await getConfig();
    const key = argv._.key as string;
    const value = config[key];

    if (value === undefined) {
      console.log(dim(`Config key "${key}" not found`));
    } else {
      console.log(value);
    }
  },
);

const setSubcommand = command(
  {
    name: "set",
    parameters: ["<key=value>"],
    description: "Set a configuration value",
  },
  async (argv) => {
    const params = argv._ as any;
    const param = params["key=value"] || Object.values(params)[0];

    if (!param || typeof param !== "string") {
      console.error("Invalid format. Use: aibranch config set key=value");
      process.exit(1);
    }

    const [key, ...valueParts] = param.split("=");
    const value = valueParts.join("=");

    if (!key || value === undefined || value === "") {
      console.error("Invalid format. Use: aibranch config set key=value");
      process.exit(1);
    }

    await setConfig(key, value);
    console.log(green(`✓ Set ${key}=${value}`));
  },
);

export const configCommand = command(
  {
    name: "config",
    description: "Manage configuration",
    commands: [getSubcommand, setSubcommand],
  },
  async () => {
    // Show all config when no subcommand
    const config = await getAllConfig();

    if (Object.keys(config).length === 0) {
      console.log(dim("No configuration found. Run `aibranch setup` first."));
      return;
    }

    console.log(cyan("Current configuration:"));
    console.log("");

    for (const [key, value] of Object.entries(config)) {
      // Mask API keys
      if (key.includes("KEY") || key.includes("TOKEN")) {
        console.log(`  ${key}: ${dim("***" + (value as string).slice(-4))}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  },
);
