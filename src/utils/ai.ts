import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getConfig } from "./config.js";

export async function generateBranchNames(options: {
  context: string;
  description?: string;
  type: string;
  count: number;
}): Promise<string[]> {
  const config = await getConfig();

  const prompt = `You are a Git branch naming expert. Generate ${options.count} professional, descriptive branch names based on the following context.

Branch Type: ${options.type}
${options.description ? `Task Description: ${options.description}` : ""}

Git Context:
${options.context}

Requirements:
- Follow format: ${options.type}/descriptive-name-with-hyphens
- Use lowercase and hyphens only
- Be concise but descriptive (max 50 characters)
- Follow conventional naming: feature/, bugfix/, hotfix/, release/
- Examples: feature/user-authentication, bugfix/fix-login-error

Generate ${options.count} branch name suggestions. Return ONLY the branch names, one per line, without numbers or additional text.`;

  const model = openai(config.OPENAI_MODEL || "gpt-4o-mini", {
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_BASE_URL,
  });

  const { text } = await generateText({
    model,
    prompt,
    temperature: 0.7,
    maxTokens: 200,
  });

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.match(/^\d+\./))
    .slice(0, options.count);
}
