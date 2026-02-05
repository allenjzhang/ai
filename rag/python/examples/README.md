# Examples

Quick startup for the RAG MVP example dataset.

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Populate `.env` based on `.env.example` if you plan to use Azure/OpenAI.

4. Try the CLI demo:

```bash
python -m rag.src.chat.cli add-docs examples/sample_docs
python -m rag.src.chat.cli chat
```

The `chat` command performs a simple retrieval demo. For a production setup, ensure you install and configure a ChromaDB persistence directory or a vector DB of your choice.
