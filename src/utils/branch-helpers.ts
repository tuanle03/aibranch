import * as p from "@clack/prompts";
import { blue, gray, green, yellow } from "kolorist";
import type { BranchType } from "./prompts.js";

export interface BranchTypeDetection {
  type: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Present branch type options to user
 * Extracted from generate.ts for reusability
 */
export async function selectBranchType(
  detectedType?: BranchTypeDetection,
): Promise<string> {
  const options = [
    { value: "feat", label: "feat - A new feature" },
    { value: "fix", label: "fix - A bug fix" },
    { value: "docs", label: "docs - Documentation only changes" },
    {
      value: "style",
      label: "style - Code style changes (formatting, etc.)",
    },
    { value: "refactor", label: "refactor - Code refactoring" },
    { value: "perf", label: "perf - Performance improvements" },
    { value: "test", label: "test - Adding or updating tests" },
    { value: "chore", label: "chore - Build/tooling changes" },
    { value: "build", label: "build - Build system changes" },
    { value: "ci", label: "ci - CI configuration changes" },
    { value: "custom", label: "custom - Enter custom type" },
  ];

  // Reorder if detected type exists
  if (detectedType) {
    const detectedIndex = options.findIndex(
      (opt) => opt.value === detectedType.type,
    );
    if (detectedIndex > -1) {
      const [detected] = options.splice(detectedIndex, 1);
      detected.label = `${detected.label} ${blue("(detected)")}`;
      options.unshift(detected);
    }
  }

  const selected = await p.select({
    message: "Select branch type:",
    options,
    initialValue: detectedType?.type || "feat",
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  if (selected === "custom") {
    const customType = await p.text({
      message: "Enter custom branch type:",
      placeholder: "e.g., hotfix, experiment",
    });

    if (p.isCancel(customType)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    return customType as string;
  }

  return selected as string;
}

/**
 * Display detection info
 */
export function showDetectionInfo(
  detection: BranchTypeDetection,
  files: string[],
) {
  const confidenceEmoji = {
    high: "🎯",
    medium: "🎲",
    low: "🤔",
  }[detection.confidence];

  p.note(
    [
      `📁 ${files.length} file(s) changed`,
      blue(
        `${confidenceEmoji} Detected type: ${detection.type} (${detection.confidence} confidence)`,
      ),
      gray(
        `Files: ${files.slice(0, 3).join(", ")}${files.length > 3 ? "..." : ""}`,
      ),
    ].join("\n"),
    "Auto-detection",
  );
}
