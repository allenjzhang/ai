import assert from "node:assert";
import { ingestTextFile, ingestDirectory } from "../ingest/index.js";
import { chunkText } from "../chunker.js";
import InMemoryVectorStore from "../vectorStore/inMemory.js";

async function testIngestTextFile() {
  const doc = await ingestTextFile(
    new URL("../../sample_docs/sample.md", import.meta.url).pathname,
  );
  assert.ok(doc.length >= 1, "should ingest sample.md");
  console.log("ingestTextFile OK");
}

function testChunker() {
  const text = "a".repeat(1200);
  const chunks = chunkText(text, 500, 50);
  assert.ok(chunks.length >= 2, "chunker should produce multiple chunks");
  console.log("chunkText OK");
}

function testVectorStore() {
  const store = new InMemoryVectorStore();
  store.items = [];
  store.add({ id: "1", vector: [1, 0, 0], text: "one", source: "s" });
  store.add({ id: "2", vector: [0, 1, 0], text: "two", source: "s" });
  const nearest = store.nearest([1, 0, 0], 1);
  assert.strictEqual(nearest[0].item.id, "1");
  console.log("InMemoryVectorStore OK");
}

async function run() {
  await testIngestTextFile();
  testChunker();
  testVectorStore();
  console.log("ALL TESTS PASSED");
}

run().catch((err) => {
  console.error("TESTS FAILED", err);
  process.exit(1);
});
