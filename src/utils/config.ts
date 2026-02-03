import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import ini from "ini";

const CONFIG_PATH = join(homedir(), ".aibranch");

export async function getConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  const content = readFileSync(CONFIG_PATH, "utf-8");
  return ini.parse(content);
}

export async function getAllConfig() {
  return getConfig();
}

export async function setConfig(key: string, value: string) {
  const config = await getConfig();
  config[key] = value;
  writeFileSync(CONFIG_PATH, ini.stringify(config));
}
