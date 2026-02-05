/**
 * Gmail email via Google API with OAuth.
 */
import { google } from "googleapis";
import type { EmailMessage } from "../types/email.js";
import { loadTokens, getValidAccessToken } from "../auth/google.js";
import type { GoogleAuthConfig } from "../auth/google.js";

export interface GmailOptions {
  auth: GoogleAuthConfig;
  /** Fetch messages from the last N hours (default 24). */
  hoursBack?: number;
  /** Max messages to fetch (default 50). */
  maxResults?: number;
}

interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string };
}

interface GmailMessage {
  id?: string;
  payload?: {
    headers?: Array<{ name?: string; value?: string }>;
    body?: { data?: string };
    parts?: GmailMessagePart[];
  };
  snippet?: string;
}

function decodeBase64Url(s: string): string {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function getHeader(headers: Array<{ name?: string; value?: string }> | undefined, name: string): string {
  const h = (headers ?? []).find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

function getBodyText(payload: GmailMessage["payload"]): string {
  if (!payload) return "";
  const parts = payload.parts ?? [];
  const textPart = parts.find((p) => p.mimeType === "text/plain");
  if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

function toEmailMessage(m: GmailMessage, source: "gmail"): EmailMessage {
  const headers = m.payload?.headers ?? [];
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const to = getHeader(headers, "To").split(",").map((s) => s.trim()).filter(Boolean);
  const dateStr = getHeader(headers, "Date");
  const receivedAt = dateStr ? new Date(dateStr) : new Date(0);
  const snippet = m.snippet ?? getBodyText(m.payload).slice(0, 500);
  return {
    id: m.id ?? "",
    source,
    subject: subject || "(No subject)",
    from,
    to,
    receivedAt,
    snippet: snippet.slice(0, 500),
    bodyPreview: m.snippet,
  };
}

export async function fetchGmailEmails(options: GmailOptions): Promise<EmailMessage[]> {
  const { auth, hoursBack = 24, maxResults = 50 } = options;
  await loadTokens(auth);
  await getValidAccessToken(auth);

  const { getOAuth2Client } = await import("../auth/google.js");
  const oauth2Client = getOAuth2Client(auth);
  const gmailAuth = google.gmail({ version: "v1", auth: oauth2Client });
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const after = Math.floor(since.getTime() / 1000);

  const listRes = await gmailAuth.users.messages.list({
    userId: "me",
    maxResults,
    q: `after:${after}`,
  });

  const list = listRes.data.messages ?? [];
  const messages: EmailMessage[] = [];

  for (const entry of list) {
    const entryId = entry.id ?? undefined;
    if (!entryId) continue;
    const res = await gmailAuth.users.messages.get({
      userId: "me",
      id: entryId,
      format: "full",
    });
    const msg = res.data as unknown as GmailMessage;
    messages.push(toEmailMessage(msg, "gmail"));
  }

  messages.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  return messages;
}

/** Fetch .ics content from a Gmail message (for calendar invites). Returns first calendar part. */
export async function fetchGmailMessageIcs(
  messageId: string,
  options: GmailOptions
): Promise<string | null> {
  const { auth } = options;
  await loadTokens(auth);
  await getValidAccessToken(auth);

  const { getOAuth2Client } = await import("../auth/google.js");
  const oauth2Client = getOAuth2Client(auth);
  const gmailAuth = google.gmail({ version: "v1", auth: oauth2Client });

  const res = await gmailAuth.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const msg = res.data as unknown as GmailMessage;
  const parts = msg.payload?.parts ?? [];
  const icsPart = parts.find(
    (p) =>
      p.body?.data &&
      (p.mimeType === "text/calendar" ||
        p.mimeType === "application/ics" ||
        (p as { filename?: string }).filename?.toLowerCase().endsWith(".ics"))
  );
  if (!icsPart?.body?.data) {
    if (msg.payload?.body?.data && (msg.payload as { mimeType?: string }).mimeType === "text/calendar") {
      return decodeBase64Url(msg.payload.body.data);
    }
    return null;
  }
  return decodeBase64Url(icsPart.body.data);
}
