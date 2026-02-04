export const branchTypeDescriptions = {
  feat: "A new feature",
  fix: "A bug fix",
  docs: "Documentation only changes",
  style: "Code style changes (formatting, white-space, etc)",
  refactor:
    "A code change that improves structure without changing functionality",
  perf: "A code change that improves performance",
  test: "Adding missing tests or correcting existing tests",
  build: "Changes that affect the build system or external dependencies",
  ci: "Changes to CI configuration files and scripts",
  chore: "Other changes that don't modify src or test files",
} as const;

export type BranchType = keyof typeof branchTypeDescriptions;

/**
 * Generate a concise prompt for branch name generation
 * Following aicommits style - clear, specific, actionable
 */
export const generateBranchNamePrompt = (
  type: string,
  description: string | undefined,
  context: string,
  count: number,
): string => {
  const lines = [
    "You are an expert Git workflow architect.",
    "",
    "Generate Git branch names following these STRICT rules:",
    "",
    "FORMAT: <type>/<description>",
    `- type: ${type}`,
    `- description: lowercase, hyphen-separated, verb-noun structure`,
    "",
    "EXAMPLES:",
    "  feat/add-user-authentication",
    "  fix/resolve-login-redirect-bug",
    "  docs/update-api-documentation",
    "  refactor/simplify-payment-logic",
    "",
    "CONSTRAINTS:",
    "- Maximum length: 50 characters",
    "- No special characters except hyphens",
    "- Use imperative mood (add, fix, update)",
    "- Be specific, avoid generic terms (update, change, improve)",
    "",
    "CONTEXT:",
  ];

  if (description) {
    lines.push(`User description: ${description}`);
  }

  lines.push(`Git context:\n${context}`);
  lines.push("");
  lines.push("OUTPUT:");
  lines.push(`Generate EXACTLY ${count} unique branch names.`);
  lines.push("One per line. No numbering. No explanations. No markdown.");
  lines.push("Respond with ONLY the branch names.");

  return lines.join("\n");
};

/**
 * Prompt for auto-generating description from git diff
 * Following aicommits approach
 */
export const generateDescriptionPrompt = (
  files: string[],
  diff: string,
  status: string,
  fileStats: { added: number; modified: number; deleted: number },
): string => {
  return [
    "You are a senior code reviewer analyzing git changes.",
    "",
    "Task: Summarize the MAIN INTENTION of these changes in one sentence.",
    "",
    "RULES:",
    "- Use imperative mood (Add, Fix, Update, Remove)",
    "- Describe WHAT changed, not HOW",
    "- Be specific: mention concrete details (file names, functions, features)",
    "- Maximum 100 characters",
    "- No punctuation at the end",
    "",
    "EXAMPLES:",
    "- Add user authentication with JWT tokens",
    "- Fix memory leak in payment processor",
    "- Update API documentation for v2 endpoints",
    "- Remove deprecated logging utilities",
    "",
    "CHANGED FILES:",
    `${files.slice(0, 10).join("\n")}`,
    files.length > 10 ? `... and ${files.length - 10} more` : "",
    "",
    "FILE STATS:",
    `+${fileStats.added} -${fileStats.deleted} (${fileStats.modified} files changed)`,
    "",
    "GIT DIFF (partial):",
    diff.slice(0, 2000),
    "",
    "OUTPUT:",
    "Return ONLY the description. No quotes. No markdown. No extra text.",
  ]
    .filter(Boolean)
    .join("\n");
};
