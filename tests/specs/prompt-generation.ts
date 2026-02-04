import { testSuite, expect } from "manten";
import {
  generateBranchNamePrompt,
  generateDescriptionPrompt,
} from "../../src/utils/prompts.js";

export default testSuite(({ describe }) => {
  describe("Prompt Generation", ({ test }) => {
    test("Should generate valid branch name prompt", () => {
      const prompt = generateBranchNamePrompt(
        "feat",
        "Add login",
        "test context",
        3,
      );

      expect(prompt).toContain("feat");
      expect(prompt).toContain("Add login");
      expect(prompt).toContain("Generate EXACTLY 3 unique branch names");
    });

    test("Should generate valid description prompt", () => {
      const prompt = generateDescriptionPrompt(
        ["src/auth.ts"],
        "diff content",
        "M  src/auth.ts",
        { added: 10, modified: 1, deleted: 5 },
      );

      expect(prompt).toContain("src/auth.ts");
      expect(prompt).toContain("+10 -5");
    });
  });
});
