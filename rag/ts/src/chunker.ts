export function chunkText(
  text: string,
  maxChars = 500,
  overlap = 50,
): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    if (end === text.length) break;
    i = end - overlap;
  }
  return chunks;
}

export default chunkText;
