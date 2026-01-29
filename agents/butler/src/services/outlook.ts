/**
 * Outlook email via Microsoft Graph API.
 */
import { Client } from "@microsoft/microsoft-graph-client";
import type { EmailMessage } from "../types/email.js";
import { acquireTokenForGraph, ensureCacheDir } from "../auth/microsoft.js";
import type { MicrosoftAuthConfig } from "../auth/microsoft.js";

const GRAPH_ME_MESSAGES =
  "https://graph.microsoft.com/v1.0/me/messages";

export interface OutlookOptions {
  auth: MicrosoftAuthConfig;
  /** Fetch messages from the last N hours (default 24). */
  hoursBack?: number;
  /** Max messages to fetch (default 50). */
  top?: number;
}

interface GraphMessage {
  id?: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  toRecipients?: Array<{ emailAddress?: { address?: string } }>;
  receivedDateTime?: string;
  bodyPreview?: string;
  body?: { content?: string };
}

function toEmailMessage(m: GraphMessage, source: "outlook"): EmailMessage {
  const from = m.from?.emailAddress?.address ?? m.from?.emailAddress?.name ?? "";
  const to = (m.toRecipients ?? [])
    .map((r) => r.emailAddress?.address)
    .filter(Boolean) as string[];
  const snippet =
    m.bodyPreview ?? (typeof m.body?.content === "string" ? m.body.content.slice(0, 500) : "") ?? "";
  return {
    id: m.id ?? "",
    source,
    subject: m.subject ?? "(No subject)",
    from,
    to,
    receivedAt: m.receivedDateTime ? new Date(m.receivedDateTime) : new Date(0),
    snippet: snippet.slice(0, 500),
    bodyPreview: m.bodyPreview,
  };
}

export async function fetchOutlookEmails(
  options: OutlookOptions
): Promise<EmailMessage[]> {
  const { auth, hoursBack = 24, top = 50 } = options;
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);

  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const sinceStr = since.toISOString();
  const filter = `receivedDateTime ge ${sinceStr}`;
  const url = `${GRAPH_ME_MESSAGES}?$top=${top}&$filter=${encodeURIComponent(filter)}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body`;

  const client = Client.init({
    authProvider: (done) => done(null, token),
  });

  const response = await client.api(url).get();
  const value: GraphMessage[] = response.value ?? [];
  return value.map((m) => toEmailMessage(m, "outlook"));
}
