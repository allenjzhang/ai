import { ingestDirectory, ingestTextFile } from "../ingest/index.js";
import { chunkText } from "../chunker.js";
import InMemoryVectorStore from "../vectorStore/inMemory.js";
import { getOpenAIEmbeddings } from "../embeddings/openai.js";
import crypto from "node:crypto";

const store = new InMemoryVectorStore();

export async function ingestAndIndexDir(dirPath: string) {
  const docs = await ingestDirectory(dirPath);
  for (const doc of docs) {
    const chunks = chunkText(doc.text, 1000, 200);
    // create embeddings in batches
    const embeddings = await getOpenAIEmbeddings(chunks);
    for (let i = 0; i < chunks.length; i++) {
      const id = crypto.randomUUID();
      store.add({
        id,
        vector: embeddings[i],
        text: chunks[i],
        source: `${doc.source}#${i}`,
      });
    }
  }
}

export async function ingestAndIndexFile(filePath: string) {
  const docs = await ingestTextFile(filePath);
  for (const doc of docs) {
    const chunks = chunkText(doc.text, 1000, 200);
    const embeddings = await getOpenAIEmbeddings(chunks);
    for (let i = 0; i < chunks.length; i++) {
      const id = crypto.randomUUID();
      store.add({
        id,
        vector: embeddings[i],
        text: chunks[i],
        source: `${doc.source}#${i}`,
      });
    }
  }
}

export default { ingestAndIndexDir, ingestAndIndexFile };
