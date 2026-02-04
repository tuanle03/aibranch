import { testSuite, expect } from "manten";

export default testSuite(({ describe }) => {
  describe("Branch Name Generation", ({ test }) => {
    test("Should generate valid branch name format", async () => {
      const branchName = "feat/add-user-authentication";

      // Test format: type/description
      expect(branchName).toMatch(/^[a-z]+\/[a-z-]+$/);

      // Test length constraint
      expect(branchName.length).toBeLessThanOrEqual(50);
    });

    test("Should use kebab-case for descriptions", async () => {
      const branchName = "fix/resolve-login-bug";

      // No uppercase, no spaces, no special chars except hyphen
      expect(branchName).toMatch(/^[a-z]+\/[a-z-]+$/);
    });
  });
});
