import fs from "node:fs";
import path from "node:path";

type VectorItem = {
  id: string;
  vector: number[];
  text: string;
  source: string;
};

const STORE_FILE = path.resolve(process.cwd(), "rag_vectors.json");

export class InMemoryVectorStore {
  items: VectorItem[] = [];

  constructor() {
    this.load();
  }

  add(item: VectorItem) {
    this.items.push(item);
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(
        STORE_FILE,
        JSON.stringify(this.items, null, 2),
        "utf-8",
      );
    } catch (e) {
      // ignore
    }
  }

  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        this.items = JSON.parse(raw);
      }
    } catch (e) {
      this.items = [];
    }
  }

  cosine(a: number[], b: number[]) {
    const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
    const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    if (na === 0 || nb === 0) return 0;
    return dot / (na * nb);
  }

  nearest(queryVec: number[], k = 5) {
    const scored = this.items.map((it) => ({
      score: this.cosine(queryVec, it.vector),
      item: it,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

export default InMemoryVectorStore;
