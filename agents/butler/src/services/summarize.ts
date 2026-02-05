/**
 * Email summarization and action-item extraction via Azure OpenAI.
 */
import OpenAI from "openai";
import type { EmailMessage, DailyDigest, ActionItem } from "../types/email.js";

export interface SummarizeConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  /** Azure OpenAI API version (e.g. 2024-02-15-preview). Required by Azure. */
  apiVersion?: string;
}

const SYSTEM_PROMPT = `You are a butler assistant. Given a list of emails (subject, from, snippet), produce:
1. A short daily digest summary (2-4 sentences).
2. A list of action items: emails that need follow-up. For each action item output: email subject, sender, and a one-sentence summary of why it needs attention.

Output JSON only, in this exact shape:
{"summary": "...", "actionItems": [{"emailSubject": "...", "from": "...", "summary": "..."}]}`;

function buildUserPrompt(emails: EmailMessage[]): string {
  const lines = emails.map(
    (e) => `- Subject: ${e.subject}\n  From: ${e.from}\n  Snippet: ${e.snippet}`
  );
  return `Emails (last 24h):\n\n${lines.join("\n\n")}`;
}

export async function summarizeEmails(
  emails: EmailMessage[],
  cfg: SummarizeConfig
): Promise<DailyDigest> {
  if (emails.length === 0) {
    return { summary: "No new emails in the period.", actionItems: [] };
  }

  const apiVersion = cfg.apiVersion ?? "2024-02-15-preview";
  const baseURL = `${cfg.endpoint.replace(/\/$/, "")}/openai/v1`;
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL,
  });

  const completion = await client.chat.completions.create({
    model: cfg.deployment,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(emails) },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Azure OpenAI returned empty response");
  }

  const parsed = JSON.parse(content) as {
    summary?: string;
    actionItems?: Array<{ emailSubject?: string; from?: string; summary?: string }>;
  };

  const actionItems: ActionItem[] = (parsed.actionItems ?? []).map((a, i) => ({
    emailId: `summary-${i}`,
    emailSubject: a.emailSubject ?? "",
    from: a.from ?? "",
    summary: a.summary ?? "",
  }));

  return {
    summary: parsed.summary ?? "No summary generated.",
    actionItems,
  };
}
