import fs from "node:fs";
import path from "node:path";

export async function ingestTextFile(
  filePath: string,
): Promise<{ text: string; source: string }[]> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".md" || ext === ".txt") {
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return [{ text: raw, source: filePath }];
  }
  throw new Error(`unsupported extension: ${ext}`);
}

export async function ingestDirectory(dirPath: string) {
  const files = await fs.promises.readdir(dirPath);
  const results: { text: string; source: string }[] = [];
  for (const f of files) {
    const p = path.join(dirPath, f);
    const stat = await fs.promises.stat(p);
    if (stat.isFile()) {
      try {
        const items = await ingestTextFile(p);
        results.push(...items);
      } catch (e) {
        // skip unsupported
      }
    }
  }
  return results;
}
