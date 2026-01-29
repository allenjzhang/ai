/**
 * Butler agent orchestrator: Outlook + Gmail → summarize → ToDo.
 */
import { config } from "./config.js";
import { fetchOutlookEmails } from "./services/outlook.js";
import { fetchGmailEmails } from "./services/gmail.js";
import { summarizeEmails } from "./services/summarize.js";
import { createDailyTodoWithSubtasks } from "./services/todo.js";
import type { EmailMessage } from "./types/email.js";

export interface RunOptions {
  /** Hours of email to include (default 24). */
  hoursBack?: number;
  /** ToDo list name (default "My Day"). */
  todoListName?: string;
  /** Skip Outlook (e.g. if not configured). */
  skipOutlook?: boolean;
  /** Skip Gmail (e.g. if not configured). */
  skipGmail?: boolean;
  /** Skip ToDo creation (dry run). */
  skipTodo?: boolean;
}

export interface RunResult {
  emails: EmailMessage[];
  summary: string;
  actionItemCount: number;
  todoTaskId?: string;
  errors: string[];
}

export async function runButler(options: RunOptions = {}): Promise<RunResult> {
  const {
    hoursBack = 24,
    todoListName = "My Day",
    skipOutlook = false,
    skipGmail = false,
    skipTodo = false,
  } = options;

  const errors: string[] = [];
  const emails: EmailMessage[] = [];

  if (!skipOutlook) {
    try {
      const msAuth = {
        clientId: config.microsoft.clientId(),
        tenantId: config.microsoft.tenantId(),
        clientSecret: config.microsoft.clientSecret(),
        tokenCachePath: config.microsoft.tokenCachePath(),
      };
      const outlookEmails = await fetchOutlookEmails({ auth: msAuth, hoursBack });
      emails.push(...outlookEmails);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Outlook: ${msg}`);
    }
  }

  if (!skipGmail) {
    try {
      const googleAuth = {
        clientId: config.google.clientId(),
        clientSecret: config.google.clientSecret(),
        redirectUri: config.google.redirectUri(),
        tokenPath: config.google.tokenPath(),
      };
      const gmailEmails = await fetchGmailEmails({ auth: googleAuth, hoursBack });
      emails.push(...gmailEmails);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Gmail: ${msg}`);
    }
  }

  emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

  let summary = "No emails to summarize.";
  let actionItemCount = 0;
  let todoTaskId: string | undefined;

  if (emails.length > 0) {
    try {
      const digest = await summarizeEmails(emails, {
        endpoint: config.azureOpenAI.endpoint(),
        apiKey: config.azureOpenAI.apiKey(),
        deployment: config.azureOpenAI.deployment(),
      });
      summary = digest.summary;
      actionItemCount = digest.actionItems.length;

      if (!skipTodo && digest.actionItems.length > 0) {
        const msAuth = {
          clientId: config.microsoft.clientId(),
          tenantId: config.microsoft.tenantId(),
          clientSecret: config.microsoft.clientSecret(),
          tokenCachePath: config.microsoft.tokenCachePath(),
        };
        todoTaskId = await createDailyTodoWithSubtasks(
          { auth: msAuth, listName: todoListName },
          new Date(),
          digest.actionItems,
          digest.summary
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Summarize/ToDo: ${msg}`);
    }
  }

  return {
    emails,
    summary,
    actionItemCount,
    todoTaskId,
    errors,
  };
}
