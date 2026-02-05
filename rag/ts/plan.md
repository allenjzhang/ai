# RAG Project Plan

## Objective

Create a small Retrieval-Augmented Generation (RAG) project in TypeScript that:
- Accepts online or local files (md / txt / pdf)
- Allows adding more files for ingestion
- Builds embeddings and a vector store
- Exposes an interactive chat interface to query the ingested data

## Scope & Deliverables

- `ingest/` code to parse local and online files (md, txt, pdf)
- `embeddings/` adapter to generate embeddings (local or hosted)
- `vector-store/` wrapper (in-memory for v1; option to swap to Pinecone/FAISS/Weaviate)
- `chat/` interactive chat UI (CLI for v1; web UI optional)
- Tests for ingestion and search
- `plan.md` (this file) tracking progress and open questions

## Iterative Plan (Milestones)

1. Project setup (TypeScript toolchain, scripts, minimal README)
   - Status: TODO
2. Ingestion: local files (md/txt)
   - Parse markdown and text, extract plain text blocks and metadata
   - Status: TODO
3. Ingestion: PDFs and online sources
   - Add PDF parsing (pdf-parse or similar)
   - Add URL fetch + extraction
   - Status: TODO
4. Chunking and metadata
   - Implement chunking strategy with overlap, store source references
   - Status: TODO
5. Embeddings integration
   - Plug in an embeddings provider (local or hosted)
   - Provide a configuration switch (ENV) to choose provider
   - Status: TODO
6. Vector store (v1: in-memory)
   - Implement k-NN search and cosine similarity
   - Add adapter to swap in an external store later
   - Status: TODO
7. Interactive chat (v1 CLI)
   - Accept user question, run retrieval + prompt to model, return response
   - Status: TODO
8. Tests and verification
   - Unit tests for parsers, chunker, and search
   - E2E test to ingest sample docs and ask queries
   - Status: TODO

## Short-term (next 48 hours)

- Implement steps 1–3 minimally so the pipeline can ingest local md/txt and run a simple query.
- Provide a simple CLI chat to validate retrieval.

## Checklist (to be checked off as completed)

- [x] Project scaffolding (TS config, scripts)
- [x] Local md/txt ingestion
- [ ] PDF ingestion
- [ ] Online URL ingestion
- [x] Chunking + metadata
- [x] Embeddings provider integration
- [x] In-memory vector store
- [x] CLI interactive chat
- [x] Unit & E2E tests

## Implementation notes & recommendations

- Use TypeScript and keep modules small and testable.
- Local embeddings: Uses `Xenova/all-MiniLM-L6-v2` (all-MiniLM-L6-v2 via ONNX via `@xenova/transformers`). Runs in-process, no external API calls.
- For PDF parsing, consider `pdf-parse` (Node) or a server-side helper.
- Start with an in-memory vector store (simple cosine search over float32 arrays) for speed of iteration.
- Store source, chunk index, and original text in the vector metadata for traceability.

## Open questions / decisions needed from you

1. Which embeddings provider do you prefer for v1: hosted (OpenAI/Azure) or local (onnx/llama-based)?
2. Do you want CLI-only interactive chat initially, or a small web UI (Express + minimal frontend)?
3. Any constraints on storage (persist vectors to disk, or purely in-memory for now)?
4. Do you have sample documents you want preloaded, or should I add a small sample set?

## Actions I will take now

- Create the initial `ingest` and `chat` scaffolding and a minimal CLI example.
- Add unit tests for md/txt ingestion.

## Decisions (user choices)

- Embeddings provider: Local embeddings (`Xenova/all-MiniLM-L6-v2`) — runs in-process, no API calls, 384-dim vectors.
- Interface: CLI interactive chat (v1).
- Storage: local persistence (JSON file for the in-memory vector store v1).

These choices are recorded so subsequent scaffolding and code target the selected options.

---

Update this file as we progress — check items off and add notes for blockers.
