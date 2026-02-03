import { command } from "cleye";
import * as p from "@clack/prompts";
import { setConfig } from "../utils/config.js";

export const setupCommand = command(
  {
    name: "setup",
    description: "Setup AI provider configuration",
  },
  async () => {
    p.intro("🔧 AI Branch Setup");

    const provider = await p.select({
      message: "Select AI provider:",
      options: [
        { value: "openai", label: "OpenAI" },
        { value: "togetherai", label: "TogetherAI (recommended)" },
        { value: "ollama", label: "Ollama (local)" },
        { value: "custom", label: "Custom OpenAI-compatible" },
      ],
    });

    if (p.isCancel(provider)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }

    const apiKey = await p.text({
      message: "Enter your API key:",
      placeholder: "sk-...",
    });

    if (p.isCancel(apiKey)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }

    await setConfig("OPENAI_API_KEY", apiKey as string);
    await setConfig("provider", provider as string);

    p.outro("✓ Configuration saved!");
  },
);
