/**
 * E2E test: create a real Microsoft ToDo task with checklist items, verify, then delete.
 * Requires Microsoft auth (AZURE_* or token file from pnpm run auth:microsoft).
 * Run: pnpm test:e2e
 * With Microsoft auth (AZURE_* in .env or token from pnpm run auth:microsoft): test runs and creates a task in list "Butler E2E Test", then deletes it.
 * Without Microsoft auth: test is skipped.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createDailyTodoWithSubtasks, ensureTodoList } from "../../src/services/todo.js";
import { config } from "../../src/config.js";
import { Client } from "@microsoft/microsoft-graph-client";
import { acquireTokenForGraph, ensureCacheDir } from "../../src/auth/microsoft.js";

const E2E_LIST_NAME = "Butler E2E Test";

function getAuth() {
  return config.getMicrosoftAuth();
}

async function getListId(auth: ReturnType<typeof getAuth>): Promise<string | null> {
  if (!auth) return null;
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);
  const client = Client.init({ authProvider: (done) => done(null, token) });
  const res = await client.api("https://graph.microsoft.com/v1.0/me/todo/lists").get();
  const lists: Array<{ id?: string; displayName?: string }> = res.value ?? [];
  const found = lists.find((l) => l.displayName === E2E_LIST_NAME);
  return found?.id ?? null;
}

async function deleteTask(
  auth: ReturnType<typeof getAuth>,
  listId: string,
  taskId: string
): Promise<void> {
  if (!auth) return;
  await ensureCacheDir(auth.tokenCachePath);
  const token = await acquireTokenForGraph(auth);
  const client = Client.init({ authProvider: (done) => done(null, token) });
  await client
    .api(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${taskId}`)
    .delete();
}

describe("ToDo e2e", () => {
  let createdListId: string | null = null;
  let createdTaskId: string | null = null;

  const auth = getAuth();

  beforeAll(async () => {
    if (auth) {
      createdListId = await ensureTodoList(auth, E2E_LIST_NAME);
    }
  });

  afterAll(async () => {
    if (auth && createdListId && createdTaskId) {
      await deleteTask(auth, createdListId, createdTaskId);
    }
  });

  it(
    "createDailyTodoWithSubtasks creates a task with checklist items",
    async () => {
      if (!auth) throw new Error("Microsoft auth not configured");

      const actionItems = [
        {
          emailId: "e2e-1",
          emailSubject: "E2E Test Email 1",
          from: "test1@example.com",
          summary: "Needs follow-up for e2e test.",
        },
        {
          emailId: "e2e-2",
          emailSubject: "E2E Test Email 2",
          from: "test2@example.com",
          summary: "Another action for e2e.",
        },
      ];

      const taskId = await createDailyTodoWithSubtasks(
        { auth, listName: E2E_LIST_NAME },
        new Date(),
        actionItems,
        "E2E test digest summary."
      );

      expect(taskId).toBeTruthy();
      expect(typeof taskId).toBe("string");
      createdTaskId = taskId;

      const listId = createdListId ?? (await getListId(auth));
      expect(listId).toBeTruthy();

      const token = await acquireTokenForGraph(auth);
      const client = Client.init({ authProvider: (done) => done(null, token) });

      const task = await client
        .api(
          `https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${taskId}`
        )
        .get();

      expect(task).toBeDefined();
      expect(task.title).toContain("Daily Email Digest");
      expect(task.body?.content).toContain("E2E test digest summary");

      const checklistRes = await client
        .api(
          `https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${taskId}/checklistItems`
        )
        .get();
      const items: Array<{ displayName?: string }> = checklistRes.value ?? [];
      expect(items.length).toBe(2);
      const titles = items.map((i) => i.displayName ?? "").sort();
      expect(titles).toContain("E2E Test Email 1");
      expect(titles).toContain("E2E Test Email 2");
    },
    { skip: !auth }
  );
});
