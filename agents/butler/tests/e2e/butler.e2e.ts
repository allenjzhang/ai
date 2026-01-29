/**
 * E2E test: full butler flow (Outlook + Gmail → summarize → ToDo).
 * Requires env: AZURE_OPENAI_*, AZURE_*, GOOGLE_* (or use skipOutlook/skipGmail).
 * Run: pnpm test:e2e
 */
import { describe, it, expect } from "vitest";
import { runButler } from "../../src/orchestrator.js";

describe("butler e2e", () => {
  it("runButler with all providers skipped returns valid result", async () => {
    const result = await runButler({
      skipOutlook: true,
      skipGmail: true,
      skipTodo: true,
    });
    expect(result).toHaveProperty("emails");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("actionItemCount");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.emails)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
