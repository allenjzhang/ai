/**
 * Butler agent orchestrator: Outlook + Gmail → summarize → ToDo; also creates ToDo entries for calendar invites.
 */
import { config } from "./config.js";
import { fetchOutlookEmails } from "./services/outlook.js";
import { fetchGmailEmails } from "./services/gmail.js";
import { summarizeEmails } from "./services/summarize.js";
import { createDailyTodoWithSubtasks, createTodoFromCalendarInvite } from "./services/todo.js";
import { getCalendarInvitesFromEmails } from "./services/calendarToTodo.js";
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
  /** Skip creating ToDo entries from calendar invites (default false). */
  skipCalendarToTodo?: boolean;
}

export interface RunResult {
  emails: EmailMessage[];
  summary: string;
  actionItemCount: number;
  todoTaskId?: string;
  /** Task IDs for calendar-invite ToDo entries created. */
  calendarTodoTaskIds?: string[];
  errors: string[];
}

export async function runButler(options: RunOptions = {}): Promise<RunResult> {
  const {
    hoursBack = 24,
    todoListName = "My Day",
    skipOutlook = false,
    skipGmail = false,
    skipTodo = false,
    skipCalendarToTodo = false,
  } = options;

  const errors: string[] = [];
  const emails: EmailMessage[] = [];
  const calendarTodoTaskIds: string[] = [];

  if (!skipOutlook) {
    const msAuth = config.getMicrosoftAuth();
    if (msAuth) {
      try {
        const outlookEmails = await fetchOutlookEmails({ auth: msAuth, hoursBack });
        emails.push(...outlookEmails);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Outlook: ${msg}`);
      }
    }
  }

  if (!skipGmail) {
    const googleAuth = config.getGoogleAuth();
    if (googleAuth) {
      try {
        const gmailEmails = await fetchGmailEmails({ auth: googleAuth, hoursBack });
        emails.push(...gmailEmails);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Gmail: ${msg}`);
      }
    }
  }

  emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

  const msAuthForTodo = config.getMicrosoftAuth();
  const googleAuthForTodo = config.getGoogleAuth();

  if (emails.length > 0 && !skipTodo && !skipCalendarToTodo && msAuthForTodo) {
    try {
      const calendarInvites = await getCalendarInvitesFromEmails(emails, {
        outlookAuth: msAuthForTodo,
        gmailAuth: googleAuthForTodo ?? null,
      });
      for (const { invite } of calendarInvites) {
        try {
          const taskId = await createTodoFromCalendarInvite(
            { auth: msAuthForTodo, listName: todoListName },
            invite
          );
          calendarTodoTaskIds.push(taskId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Calendar ToDo (${invite.title}): ${msg}`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Calendar invites: ${msg}`);
    }
  }

  let summary = "No emails to summarize.";
  let actionItemCount = 0;
  let todoTaskId: string | undefined;

  if (emails.length > 0) {
    try {
      const digest = await summarizeEmails(emails, {
        endpoint: config.azureOpenAI.endpoint(),
        apiKey: config.azureOpenAI.apiKey(),
        deployment: config.azureOpenAI.deployment(),
        apiVersion: config.azureOpenAI.apiVersion(),
      });
      summary = digest.summary;
      actionItemCount = digest.actionItems.length;

      if (!skipTodo && digest.actionItems.length > 0) {
        const msAuth = config.getMicrosoftAuth();
        if (msAuth) {
          todoTaskId = await createDailyTodoWithSubtasks(
            { auth: msAuth, listName: todoListName },
            new Date(),
            digest.actionItems,
            digest.summary
          );
        }
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
    calendarTodoTaskIds: calendarTodoTaskIds.length > 0 ? calendarTodoTaskIds : undefined,
    errors,
  };
}
