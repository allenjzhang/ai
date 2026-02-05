import { pipeline, env } from "@xenova/transformers";

// Allow downloading model on first use, then cache it locally
env.allowRemoteModels = true;
env.allowLocalModels = true;

let extractor: any = null;

export async function getLocalEmbeddings(texts: string[]): Promise<number[][]> {
  if (!extractor) {
    // Initialize the embedding pipeline (runs locally in-process)
    // Downloads model on first run, caches it for future runs
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
