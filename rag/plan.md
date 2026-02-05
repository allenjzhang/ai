# RAG Project Plan

## Project Overview

Build a Python-based Retrieval-Augmented Generation (RAG) system that allows users to load documents from local or online sources and interact with them via an interactive chat interface.

## Iterative Breakdown

### Phase 1: Project Setup & Architecture ⚙️

- [ ] Set up Python project structure (venv, requirements.txt)
- [ ] Create project configuration system
- [ ] Set up logging
- [ ] Create base classes for components

### Phase 2: Document Loading Pipeline 📄

- [ ] Create document loader abstraction
- [ ] Implement local MD file loader
- [ ] Implement online MD file loader (GitHub, web URLs)
- [ ] Create document chunking strategy
- [ ] Add metadata extraction

**Action Items:**

- Define chunk size strategy and overlap
- Decide how to handle large files

### Phase 3: Vector Database Integration 🗃️

- [ ] Initialize vector DB connection
- [ ] Implement embedding pipeline
- [ ] Create document storage mechanism
- [ ] Add document deletion/update capabilities
- [ ] Implement similarity search

**Action Items:**

- Test embedding quality with sample documents

### Phase 4: Retrieval & RAG Core 🔍

- [ ] Create retrieval component
- [ ] Implement context assembly
- [ ] Integrate with LLM provider
- [ ] Create prompt engineering utilities
- [ ] Add conversation context handling

**Action Items:**

- Test retrieval accuracy
- Optimize prompt templates

### Phase 5: Interactive Chat Interface 💬

- [ ] Create CLI chat application
- [ ] Implement conversation history
- [ ] Add command system (add docs, clear, help, etc.)
- [ ] Implement graceful error handling
- [ ] Add source citation/attribution

**Action Items:**

- User testing and feedback

### Phase 6: Testing & Optimization 🧪

- [ ] Unit tests for components
- [ ] Integration tests
- [ ] Performance benchmarking
- [ ] Documentation completion

**Action Items:**

- Create example usage scenarios

## Project Structure (Proposed)

```
rag/
├── plan.md
├── rag_process.md
├── requirements.txt
├── .env.example
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── loaders/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── local.py
│   │   └── online.py
│   ├── embeddings/
│   │   ├── __init__.py
│   │   └── embedder.py
│   ├── vector_db/
│   │   ├── __init__.py
│   │   └── store.py
│   ├── retrieval/
│   │   ├── __init__.py
│   │   └── retriever.py
│   ├── llm/
│   │   ├── __init__.py
│   │   └── provider.py
│   └── chat/
│       ├── __init__.py
│       └── cli.py
├── tests/
│   ├── __init__.py
│   ├── test_loaders.py
│   ├── test_embeddings.py
│   └── test_retrieval.py
└── examples/
    └── sample_docs/
```

## Dependencies (High Level)

- Document loading: `requests`, `beautifulsoup4`
- Document types: md and txt only
- Embeddings: `sentence-transformers` or provider-specific SDK
- Vector DB: ChromaDB
- LLM: Azure OpenAI
- CLI: `click` or `typer`
- Development: `pytest`, `python-dotenv`
- Scale is small just 1-2MB
- Use a local config file that is gitignored to store online credentials such as API keys
- Use Python3

Additional notes and recommendations:

- Python environment: create a virtual environment (`python -m venv .venv`) and activate it before installing dependencies.
- Provide a pinned `requirements.txt` for reproducible installs (we'll add this as a tracked task).
- Use `typer` as the preferred CLI framework (async-friendly and modern). `click` remains an alternative.
- Embeddings: default to `sentence-transformers` for local runs, with an optional fallback to OpenAI/Azure embeddings for comparison/quality.
- Document type roadmap: MVP supports `md` and `txt`. Add PDF/DOCX/other formats in a follow-up phase (convert via `pdfplumber`/`python-docx`).
- Secrets: store API keys and credentials in a `.env` file (gitignored). Include a `.env.example` in the repo.
- Formatting & linting: add `black` and `ruff` (optional but recommended).
- CI: add a lightweight GitHub Actions workflow to run `pytest` on pushes/PRs.

## Next Steps

1. Create `requirements.txt` with pinned package versions and add installation instructions.
2. Add `.env.example` and update `.gitignore` to exclude `.env` and local data directories.
3. Add a CI workflow (`.github/workflows/ci.yml`) to run tests with `pytest`.
4. Start Phase 1: Project Setup — venv, install deps, basic `config.py`, and logging.
5. Implement a minimal Chroma integration and CLI demo to validate end-to-end flow (`src/vector_db/store.py`, `src/chat/cli.py`).
6. Add `examples/sample_docs/` with a small dataset and `examples/README.md` showing quick run steps.
7. Create basic unit tests for loaders and embeddings and wire into CI.
8. Finalize any remaining open questions (vector DB, LLM provider confirmations already set in the plan).
