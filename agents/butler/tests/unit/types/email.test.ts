import { describe, it, expect } from "vitest";
import type { EmailMessage, ActionItem, DailyDigest } from "../../../src/types/email.js";

describe("email types", () => {
  it("EmailMessage has required fields", () => {
    const msg: EmailMessage = {
      id: "1",
      source: "outlook",
      subject: "Test",
      from: "a@b.com",
      to: ["c@d.com"],
      receivedAt: new Date(),
      snippet: "Snippet",
    };
    expect(msg.source).toBe("outlook");
    expect(msg.subject).toBe("Test");
  });

  it("ActionItem has required fields", () => {
    const item: ActionItem = {
      emailId: "1",
      emailSubject: "Re: Project",
      from: "x@y.com",
      summary: "Needs reply",
    };
    expect(item.emailSubject).toBe("Re: Project");
  });

  it("DailyDigest has summary and actionItems", () => {
    const digest: DailyDigest = {
      summary: "Brief summary.",
      actionItems: [],
    };
    expect(digest.summary).toBe("Brief summary.");
    expect(digest.actionItems).toEqual([]);
  });
});
