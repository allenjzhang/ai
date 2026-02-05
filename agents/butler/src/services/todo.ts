/**
 * Microsoft ToDo API: one daily task with checklist-item sub-tasks (displayName = email title; notes in main body).
 * Also supports creating a single task from a calendar invite (title, body, due date, recurrence).
 */
import { Client } from "@microsoft/microsoft-graph-client";
import { acquireTokenForGraph, ensureCacheDir } from "../auth/microsoft.js";
import type { MicrosoftAuthConfig } from "../auth/microsoft.js";
import type { ActionItem } from "../types/email.js";
import type { CalendarInvite } from "../types/calendar.js";
import { rruleToGraphRecurrence } from "../utils/rruleToGraph.js";

const GRAPH_ME_TODO_LISTS = "https://graph.microsoft.com/v1.0/me/todo/lists";
const GRAPH_ME_TASKS = (listId: string) =>
  `https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks`;
const GRAPH_TASK_CHECKLIST = (listId: string, taskId: string) =>
  `https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${taskId}/checklistItems`;

export interface TodoOptions {
  auth: MicrosoftAuthConfig;
  /** ToDo list name to use (e.g. "My Day" or a custom list). If not set, uses first list or default. */
  listName?: string;
}

interface GraphTask {
  id?: string;
  title: string;
  body?: { content: string; contentType: "text" };
  dueDateTime?: { dateTime: string; timeZone: string };
  recurrence?: { pattern: unknown; range: unknown };
}

export async function ensureTodoList(
  auth: MicrosoftAuthConfig,
  listName: string
): Promise<string> {
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);
  const client = Client.init({ authProvider: (done) => done(null, token) });

  const listsRes = await client.api(GRAPH_ME_TODO_LISTS).get();
  const lists: Array<{ id?: string; displayName?: string }> = listsRes.value ?? [];
  const found = lists.find((l) => l.displayName === listName);
  if (found?.id) return found.id;

  const createRes = await client.api(GRAPH_ME_TODO_LISTS).post({
    displayName: listName,
  });
  return (createRes as { id?: string }).id ?? "";
}

export async function createDailyTodoWithSubtasks(
  options: TodoOptions,
  date: Date,
  actionItems: ActionItem[],
  digestSummary: string
): Promise<string> {
  const { auth, listName = "My Day" } = options;
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);
  const client = Client.init({ authProvider: (done) => done(null, token) });

  const listsRes = await client.api(GRAPH_ME_TODO_LISTS).get();
  const lists: Array<{ id?: string; displayName?: string }> = listsRes.value ?? [];
  let listId = lists.find((l) => l.displayName === listName)?.id;
  if (!listId && lists[0]?.id) listId = lists[0].id;
  if (!listId) {
    const createRes = await client.api(GRAPH_ME_TODO_LISTS).post({
      displayName: listName,
    });
    listId = (createRes as { id?: string }).id ?? "";
  }

  const dateStr = date.toISOString().slice(0, 10);
  const mainTitle = `Daily Email Digest – ${dateStr}`;

  const bodyLines = [digestSummary];
  for (const item of actionItems) {
    bodyLines.push(`• ${item.emailSubject}\n  From: ${item.from}\n  Summary: ${item.summary}`);
  }
  const mainBody = bodyLines.join("\n\n");

  const mainTask = await client.api(GRAPH_ME_TASKS(listId)).post({
    title: mainTitle,
    body: { content: mainBody, contentType: "text" },
  } as GraphTask);

  const mainId = (mainTask as { id?: string }).id;
  if (!mainId) throw new Error("Failed to create main ToDo task");

  for (const item of actionItems) {
    await client.api(GRAPH_TASK_CHECKLIST(listId, mainId)).post({
      displayName: item.emailSubject,
      isChecked: false,
    });
  }

  return mainId;
}

/** Resolve list name to list id (get or create). */
async function resolveListId(
  client: ReturnType<typeof Client.init>,
  listName: string
): Promise<string> {
  const listsRes = await client.api(GRAPH_ME_TODO_LISTS).get();
  const lists: Array<{ id?: string; displayName?: string }> = listsRes.value ?? [];
  let listId = lists.find((l) => l.displayName === listName)?.id;
  if (!listId && lists[0]?.id) listId = lists[0].id;
  if (!listId) {
    const createRes = await client.api(GRAPH_ME_TODO_LISTS).post({
      displayName: listName,
    });
    listId = (createRes as { id?: string }).id ?? "";
  }
  return listId;
}

/**
 * Create a single ToDo task from a calendar invite: title = email title, body = notes, due date and recurrence from invite.
 */
export async function createTodoFromCalendarInvite(
  options: TodoOptions,
  invite: CalendarInvite
): Promise<string> {
  const { auth, listName = "My Day" } = options;
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);
  const client = Client.init({ authProvider: (done) => done(null, token) });

  const listId = await resolveListId(client, listName);

  const dueDateTime = {
    dateTime: invite.start.toISOString().slice(0, 19).replace("Z", "0000000"),
    timeZone: invite.timeZone ?? "UTC",
  };

  const payload: GraphTask = {
    title: invite.title,
    body: { content: invite.body || "(Calendar invite)", contentType: "text" },
    dueDateTime,
  };

  if (invite.rrule) {
    const recurrence = rruleToGraphRecurrence(
      invite.rrule,
      invite.start,
      invite.timeZone ?? "UTC"
    );
    if (recurrence) {
      payload.recurrence = {
        pattern: recurrence.pattern,
        range: recurrence.range,
      };
    }
  }

  const task = await client.api(GRAPH_ME_TASKS(listId)).post(payload);
  const taskId = (task as { id?: string }).id;
  if (!taskId) throw new Error("Failed to create calendar-invite ToDo task");
  return taskId;
}
