import readline from "node:readline";
import { getLocalEmbeddings } from "../embeddings/openai.js";
import InMemoryVectorStore from "../vectorStore/inMemory.js";

const store = new InMemoryVectorStore();

export async function runCli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Type a question, or `exit` to quit.");

  for await (const line of rl) {
    const q = (line as string).trim();
    if (!q) continue;
    if (q.toLowerCase() === "exit") {
      rl.close();
      break;
    }

    try {
      const vectors = await getLocalEmbeddings([q]);
      const qv = vectors[0];
      const neighbors = store.nearest(qv, 5);
      console.log("Top matches:");
      for (const n of neighbors) {
        console.log(`- (score=${n.score.toFixed(3)}) ${n.item.source}`);
      }
    } catch (e) {
      console.error("Query failed:", e);
    }
  }
}

export default runCli;
