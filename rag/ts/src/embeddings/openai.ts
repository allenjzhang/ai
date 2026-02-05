import { pipeline, env } from "@xenova/transformers";

// Run embeddings locally without remote model loading
env.allowLocalModels = true;
env.allowRemoteModels = false;

let extractor: any = null;

export async function getLocalEmbeddings(texts: string[]): Promise<number[][]> {
  if (!extractor) {
    // Initialize the embedding pipeline (runs locally in-process)
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await extractor(texts, { pooling: "mean", normalize: true });
  // Convert tensor to array of embeddings (384 dimensions each)
  const embeddings: number[][] = [];
  const data = result.data;
  for (let i = 0; i < texts.length; i++) {
    const start = i * 384;
    const end = start + 384;
    embeddings.push(Array.from(data.slice(start, end)));
  }
  return embeddings;
}

export default getLocalEmbeddings;
