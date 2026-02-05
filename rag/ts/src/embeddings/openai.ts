const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";

export async function getOpenAIEmbeddings(
  texts: string[],
  apiKey?: string,
): Promise<number[][]> {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const body = {
    input: texts,
    model: "text-embedding-3-small",
  };

  const res = await fetch(OPENAI_EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI embed error: ${res.status} ${t}`);
  }

  const json = await res.json();
  // API returns data[].embedding
  return json.data.map((d: any) => d.embedding as number[]);
}

export default getOpenAIEmbeddings;
