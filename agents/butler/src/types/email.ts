/**
 * Unified email model for Outlook and Gmail.
 */
export interface EmailMessage {
  id: string;
  source: "outlook" | "gmail";
  subject: string;
  from: string;
  to: string[];
  receivedAt: Date;
  snippet: string;
  bodyPreview?: string;
}

/**
 * Action item extracted from emails (for ToDo sub-tasks).
 */
export interface ActionItem {
  emailId: string;
  emailSubject: string;
  from: string;
  summary: string;
}

/**
 * Daily digest result: summary text + action items.
 */
export interface DailyDigest {
  summary: string;
  actionItems: ActionItem[];
}
