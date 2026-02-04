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

  const prompt = `
  You are a senior Git workflow architect and naming convention specialist.

  Your task is to generate Git branch names that strictly follow:
  - Conventional Commits philosophy
  - Clean Git flow practices
  - Human-readable, production-grade naming

  You must infer the intent of the changes from the context below and
  translate that intent into short, meaningful branch names.

  ────────────────────────────────────
  INPUT
  ────────────────────────────────────
  Branch Type: ${options.type}

  ${
    options.description
      ? `Task Description (human summary):
  ${options.description}`
      : ""
  }

  Git Context (raw signals from repo):
  ${options.context}

  ────────────────────────────────────
  NAMING RULES
  ────────────────────────────────────
  1. Format:
     <type>/<short-action-object>

     Example:
     feat/add-user-auth
     fix/login-redirect
     docs/update-readme

  2. Constraints:
     - lowercase only
     - words separated by hyphens
     - no special characters
     - no trailing slashes
     - maximum length: 100 characters

  3. Semantic Rules:
     - Must describe WHAT is being changed
     - Must NOT describe HOW
     - Must avoid generic words (update, change, improve)
     - Prefer verb-noun structure (add-user, fix-bug, remove-cache)

  4. Allowed types:
     feat, fix, docs, style, refactor, perf, test, chore, build, ci

  ────────────────────────────────────
  OUTPUT RULES
  ────────────────────────────────────
  - Generate exactly ${options.count} unique branch names
  - One per line
  - No numbering
  - No explanations
  - No markdown
  - No extra text

  Return only the branch names.
  `;

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

// Generate description from git changes
export async function generateDescription(options: {
  files: string[];
  diff: string;
  status: string;
  fileStats: { added: number; modified: number; deleted: number };
}): Promise<string> {
  const config = await getConfig();

  const prompt = `
  You are a senior Git reviewer.

  Your job is to analyze a set of git changes and infer
  the **single most important intention** behind them.

  You must summarize the change as if it were a commit subject line.

  ────────────────────────────────────
  REPO SIGNALS
  ────────────────────────────────────

  Changed Files (${options.files.length}):
  ${options.files.slice(0, 10).join("\n")}
  ${options.files.length > 10 ? `... and ${options.files.length - 10} more` : ""}

  Git Status:
  ${options.status}

  Stats:
  +${options.fileStats.added}  -${options.fileStats.deleted}
  (${options.fileStats.modified} files changed)

  Git Diff (partial context):
  ${options.diff}

  ────────────────────────────────────
  DESCRIPTION RULES
  ────────────────────────────────────
  - Output a single sentence
  - Use imperative mood
    (e.g., "Add feature", not "Added feature")
  - Describe WHAT changed, not HOW
  - Be specific, avoid vague words
  - Max length: 200 characters
  - No punctuation at the end

  Examples:
  - Add user authentication
  - Fix login redirect bug
  - Update invoice export logic
  - Refactor payment gateway adapter

  ────────────────────────────────────
  OUTPUT
  ────────────────────────────────────
  Return ONLY the description.
  No quotes.
  No markdown.
  No extra words.
  `;

  const model = openai(config.OPENAI_MODEL || "gpt-4o-mini", {
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_BASE_URL,
  });

  const { text } = await generateText({
    model,
    prompt,
    temperature: 0.5,
    maxTokens: 200,
  });

  return text.trim();
}
