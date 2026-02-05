import { describe, it, expect, vi, beforeEach } from "vitest";
import { runButler } from "../../src/orchestrator.js";

// Avoid loading real config and calling real APIs
const mockMsAuth = {
  clientId: "test-client-id",
  tenantId: "test-tenant",
  clientSecret: "secret",
  tokenCachePath: ".cache/msal.json",
};
const mockGoogleAuth = {
  clientId: "google-client",
  clientSecret: "google-secret",
  redirectUri: "http://localhost/cb",
  tokenPath: ".cache/google.json",
};

vi.mock("../../src/config.js", () => ({
  config: {
    microsoft: {
      clientId: () => mockMsAuth.clientId,
      tenantId: () => mockMsAuth.tenantId,
      clientSecret: () => mockMsAuth.clientSecret,
      tokenCachePath: () => mockMsAuth.tokenCachePath,
    },
    google: {
      clientId: () => mockGoogleAuth.clientId,
      clientSecret: () => mockGoogleAuth.clientSecret,
      redirectUri: () => mockGoogleAuth.redirectUri,
      tokenPath: () => mockGoogleAuth.tokenPath,
    },
    azureOpenAI: {
      endpoint: () => "https://test.openai.azure.com",
      apiKey: () => "key",
      deployment: () => "gpt-4o",
    },
    getMicrosoftAuth: () => undefined,
    getGoogleAuth: () => undefined,
  },
}));

vi.mock("../../src/services/outlook.js", () => ({
  fetchOutlookEmails: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../src/services/gmail.js", () => ({
  fetchGmailEmails: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../src/services/summarize.js", () => ({
  summarizeEmails: vi.fn().mockResolvedValue({
    summary: "No new emails in the period.",
    actionItems: [],
  }),
}));
vi.mock("../../src/services/calendarToTodo.js", () => ({
  getCalendarInvitesFromEmails: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../src/services/todo.js", () => ({
  createDailyTodoWithSubtasks: vi.fn().mockResolvedValue("task-123"),
  createTodoFromCalendarInvite: vi.fn().mockResolvedValue("cal-task-1"),
}));

describe("orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runButler with skipOutlook and skipGmail returns empty emails and no ToDo", async () => {
    const result = await runButler({
      skipOutlook: true,
      skipGmail: true,
      skipTodo: true,
    });
    expect(result.emails).toEqual([]);
    expect(result.summary).toContain("No emails to summarize");
    expect(result.actionItemCount).toBe(0);
    expect(result.todoTaskId).toBeUndefined();
  });
});
