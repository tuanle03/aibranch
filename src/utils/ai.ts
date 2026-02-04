import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getConfig } from "./config.js";
import {
  generateBranchNamePrompt,
  generateDescriptionPrompt,
} from "./prompts.js";

/**
 * Sanitize AI output following aicommits approach
 */
const sanitizeOutput = (text: string): string => {
  return text
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/^-\s*/, "");
};

/**
 * Generate branch names using AI
 * Follows aicommits pattern with improved error handling
 */
export async function generateBranchNames(options: {
  context: string;
  description?: string;
  type: string;
  count: number;
}): Promise<string[]> {
  const config = await getConfig();

  if (!config.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY not configured. Run `aibranch setup` first.",
    );
  }

  const prompt = generateBranchNamePrompt(
    options.type,
    options.description,
    options.context,
    options.count,
  );

  // Create provider based on base URL (following aicommits pattern)
  const provider =
    !config.OPENAI_BASE_URL ||
    config.OPENAI_BASE_URL === "https://api.openai.com/v1"
      ? createOpenAI({
          apiKey: config.OPENAI_API_KEY,
        })
      : createOpenAICompatible({
          name: "custom",
          apiKey: config.OPENAI_API_KEY,
          baseURL: config.OPENAI_BASE_URL,
        });

  const model = provider(config.OPENAI_MODEL || "gpt-4o-mini");

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
      maxRetries: 2,
    });

    // Parse and validate output
    const branches = text
      .split("\n")
      .map((line) => sanitizeOutput(line))
      .filter((line) => line && line.includes("/"))
      .filter((line) => line.length <= 50)
      .slice(0, options.count);

    if (branches.length === 0) {
      throw new Error("Failed to generate valid branch names");
    }

    return branches;
  } catch (error: any) {
    if (error.message?.includes("API key")) {
      throw new Error(
        "Invalid API key. Run `aibranch config` to update your configuration.",
      );
    }
    throw error;
  }
}

/**
 * Generate description from git changes
 * Follows aicommits pattern
 */
export async function generateDescription(options: {
  files: string[];
  diff: string;
  status: string;
  fileStats: { added: number; modified: number; deleted: number };
}): Promise<string> {
  const config = await getConfig();

  const prompt = generateDescriptionPrompt(
    options.files,
    options.diff,
    options.status,
    options.fileStats,
  );

  // Create provider (same pattern)
  const provider =
    !config.OPENAI_BASE_URL ||
    config.OPENAI_BASE_URL === "https://api.openai.com/v1"
      ? createOpenAI({
          apiKey: config.OPENAI_API_KEY,
        })
      : createOpenAICompatible({
          name: "custom",
          apiKey: config.OPENAI_API_KEY,
          baseURL: config.OPENAI_BASE_URL,
        });

  const model = provider(config.OPENAI_MODEL || "gpt-4o-mini");

  const { text } = await generateText({
    model,
    prompt,
    temperature: 0.3,
    maxRetries: 2,
  });

  return sanitizeOutput(text);
}
