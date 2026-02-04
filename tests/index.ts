import { describe } from "manten";

describe("aibranch", ({ runTestSuite }) => {
  runTestSuite(import("./specs/branch-generation.js"));
  runTestSuite(import("./specs/prompt-generation.js"));
});
