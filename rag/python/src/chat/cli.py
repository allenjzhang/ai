"""A minimal CLI for adding documents and running a simple chat demo.

This demo uses the `VectorStore` facade. If `chromadb` is installed it will
use Chroma; otherwise it falls back to a keyword-based in-memory store.
"""
from pathlib import Path
from typing import List
import typer
from dotenv import load_dotenv
from rag.src.vector_db.store import VectorStore

app = typer.Typer()

load_dotenv()


def read_md_files(paths: List[str]) -> List[tuple]:
    docs = []
    for p in paths:
        p = Path(p)
        if p.is_dir():
            for f in p.rglob("*.md"):
                docs.append((str(f), f.read_text(encoding='utf-8')))
        elif p.is_file():
            docs.append((str(p), p.read_text(encoding='utf-8')))
    return docs


@app.command()
def add_docs(paths: List[str] = typer.Argument(...)):
    """Add markdown documents from the given paths (files or directories)."""
    store = VectorStore()
    docs = read_md_files(paths)
    ids = [d[0] for d in docs]
    texts = [d[1] for d in docs]
    metadatas = [{"source": id_} for id_ in ids]
    store.add(ids=ids, texts=texts, metadatas=metadatas)
    typer.echo(f"Added {len(docs)} documents to the vector store (or in-memory fallback).")


@app.command()
def chat():
    """Simple REPL that queries the vector store with your input."""
    store = VectorStore()
    typer.echo("Entering chat. Type 'exit' to quit.")
    while True:
        q = typer.prompt("You")
        if q.strip().lower() in ("exit", "quit"):
            break
        results = store.query(query_text=q, n_results=3)
        if not results:
            typer.echo("No results found.")
            continue
        typer.echo("Top results:")
        for r in results:
            score = r.get('score', 0)
            src = r.get('metadata', {}).get('source', r.get('id'))
            snippet = (r.get('text') or '')[:400].replace('\n', ' ')
            typer.echo(f"- [{score}] {src}: {snippet}...")


if __name__ == "__main__":
    app()
