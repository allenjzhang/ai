import dotenv from "dotenv";
import { runCli } from "./chat/cli.js";
import { ingestAndIndexDir } from "./pipeline/ingest_and_index.js";

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "ingest" && args[1]) {
    const dir = args[1];
    console.log(`Ingesting directory: ${dir}`);
    await ingestAndIndexDir(dir);
    console.log("Ingestion complete!");
  } else if (command === "chat" || !command) {
    console.log("RAG CLI — starting chat");
    await runCli();
  } else {
    console.log("Usage: npm run dev [ingest <dir> | chat]");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error", err);
  process.exit(1);
});
