# Planter Setup Helper: independent demo (not affiliated with Precision Planting)

The bot answers only from `kb.json`: 112 Q&As, each citing an official public Precision Planting guide.
Retrieval is BM25 keyword matching with farm synonyms (maize→corn, doubles→multiples, and so on).

**When it refers you to the dealer instead of answering:**
- The match is weak.
- The question is about price, ordering or warranty.
- The question is off-topic.

Answers flagged ⚠ come with a "confirm with your dealer" note.

## Run locally
    python3 server.py 8765      # then open http://localhost:8765
    node test.js                # run the retrieval tests

**Optional LLM layer.** Set `OPENAI_API_KEY`, or `LLM_API_KEY` + `LLM_BASE_URL` + `LLM_MODEL` for any OpenAI-compatible API. `/api/llm` then writes a short answer using only the retrieved Q&As. The cited KB card is always shown underneath it.

## Edit the knowledge base
Edit `build_kb.py`, then run `python3 build_kb.py`. That regenerates `kb.json` and `/workspace/pp_demo_kb.md`.

## Free hosting later
None of these have been set up.
- **GitHub Pages (simplest).** The app is fully static: `index.html`, `retriever.js` and `kb.json`. Push them to a public repo and turn on Pages. Without a server there's no LLM layer; retrieval runs in the browser.
- **Hugging Face Spaces.** Create a free "Static" Space and upload the same three files. A free Gradio/Docker Space can also run `server.py` with a key stored as a secret.
- **Chatbase free tier.** Upload `/workspace/pp_demo_kb.md` as the only training source. System prompt: "answer only from the knowledge base, cite the source URL, otherwise refer to the dealer". Check the current free-tier limits first.

**Copyright note.** Before any public or paid deployment, get permission from Precision Planting or from the dealer (PSS Ag). Better still, have the dealer license and supply the docs.
