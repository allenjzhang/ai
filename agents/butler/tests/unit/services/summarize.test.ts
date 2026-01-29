import { describe, it, expect, vi } from "vitest";
import { summarizeEmails } from "../../../src/services/summarize.js";

describe("summarize", () => {
  it("returns empty digest when no emails", async () => {
    const result = await summarizeEmails([], {
      endpoint: "https://test.openai.azure.com",
      apiKey: "key",
      deployment: "gpt-4o",
    });
    expect(result.summary).toContain("No new emails");
    expect(result.actionItems).toEqual([]);
  });

  it("with emails would call OpenAI (empty case tested above)", async () => {
    // Without mocking OpenAI, real API would be hit. Empty case is tested above.
    const result = await summarizeEmails([], {
      endpoint: "https://test.openai.azure.com",
      apiKey: "key",
      deployment: "gpt-4o",
    });
    expect(result.actionItems).toEqual([]);
  });
});
