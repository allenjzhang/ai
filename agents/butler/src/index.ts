/**
 * Butler Agent entry point.
 * Orchestrates: fetch Outlook + Gmail → summarize → create ToDo task.
 */
import { runButler } from "./orchestrator.js";

export async function run(): Promise<void> {
  const result = await runButler();
  console.log("Summary:", result.summary);
  console.log("Action items:", result.actionItemCount);
  if (result.todoTaskId) console.log("ToDo task ID:", result.todoTaskId);
  if (result.errors.length > 0) {
    console.error("Errors:", result.errors);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
