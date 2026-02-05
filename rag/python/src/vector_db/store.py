"""Simple vector store wrapper.

Attempts to use ChromaDB if installed; otherwise falls back to a lightweight
in-memory store for local demos and testing.
"""
from typing import List, Optional, Dict, Any

try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except Exception:
    chromadb = None
    CHROMA_AVAILABLE = False


class InMemoryStore:
    def __init__(self):
        self.docs = []  # list of (id, text, metadata)

    def add(self, ids: List[str], texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        metadatas = metadatas or [{} for _ in texts]
        for i, t in enumerate(texts):
            self.docs.append((ids[i], t, metadatas[i]))

    def query(self, query_text: str, n_results: int = 3):
        # very simple keyword search fallback
        scores = []
        q = query_text.lower()
        for id_, text, meta in self.docs:
            score = sum(1 for w in q.split() if w in text.lower())
            scores.append((score, id_, text, meta))
        scores.sort(reverse=True, key=lambda x: x[0])
        results = [ {"id": r[1], "text": r[2], "metadata": r[3], "score": r[0]} for r in scores[:n_results] ]
        return results


class ChromaStore:
    def __init__(self, persist_directory: Optional[str] = None):
        settings = Settings(chroma_db_impl="duckdb+parquet", persist_directory=persist_directory) if persist_directory else None
        self.client = chromadb.Client(settings) if CHROMA_AVAILABLE else None
        self.collection = None

    def init_collection(self, name: str = "rag_collection"):
        if not CHROMA_AVAILABLE:
            raise RuntimeError("ChromaDB not available; install chromadb to use ChromaStore")
        try:
            self.collection = self.client.get_collection(name)
        except Exception:
            self.collection = self.client.create_collection(name)

    def add(self, ids: List[str], texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None, embeddings: Optional[List[List[float]]] = None):
        if embeddings is not None:
            self.collection.add(ids=ids, metadatas=metadatas, embeddings=embeddings, documents=texts)
        else:
            # Chroma can create embeddings lazily with a configured embedder; here we store raw docs
            self.collection.add(ids=ids, metadatas=metadatas, documents=texts)

    def query(self, query_embedding: Optional[List[float]] = None, query_text: Optional[str] = None, n_results: int = 3):
        if query_embedding is not None:
            res = self.collection.query(query_embeddings=[query_embedding], n_results=n_results, include=['metadatas','documents','ids','distances'])
            docs = []
            for ids, docs_list, metas, dists in zip(res['ids'], res['documents'], res['metadatas'], res['distances']):
                for id_, doc, meta, dist in zip(ids, docs_list, metas, dists):
                    docs.append({"id": id_, "text": doc, "metadata": meta, "score": float(dist)})
            return docs
        elif query_text is not None:
            # fallback to metadata/text-based filter search
            res = self.collection.query(query_texts=[query_text], n_results=n_results, include=['metadatas','documents','ids','distances'])
            docs = []
            for ids, docs_list, metas, dists in zip(res['ids'], res['documents'], res['metadatas'], res['distances']):
                for id_, doc, meta, dist in zip(ids, docs_list, metas, dists):
                    docs.append({"id": id_, "text": doc, "metadata": meta, "score": float(dist)})
            return docs
        else:
            return []


class VectorStore:
    """Facade that exposes a common API and picks Chroma if available."""

    def __init__(self, persist_directory: Optional[str] = None):
        if CHROMA_AVAILABLE:
            self.store = ChromaStore(persist_directory=persist_directory)
            try:
                self.store.init_collection()
            except Exception:
                pass
        else:
            self.store = InMemoryStore()

    def add(self, ids: List[str], texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None, embeddings: Optional[List[List[float]]] = None):
        return self.store.add(ids=ids, texts=texts, metadatas=metadatas, embeddings=embeddings) if hasattr(self.store, 'add') else None

    def query(self, *args, **kwargs):
        return self.store.query(*args, **kwargs)
