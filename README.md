# aiskate

A fully local, fully private AI assistant for Apple Silicon Macs. One command to install, one URL to use — zero signups, zero cloud dependencies.

## What You Get

Open **http://localhost:3000** and you have:

- AI chat powered by Qwen3-8B running on your Metal GPU
- Web search across multiple engines (Google, Bing, Brave, arXiv, Scholar) — all privacy-preserving
- Document upload and Q&A (PDFs, Word, Excel, PowerPoint)
- Knowledge bases you can build per project
- Everything stays on your machine. The only outbound traffic is fetching web search results.

## Requirements

- macOS 13.0+ (Ventura or later, including Sequoia)
- Apple Silicon (M1/M2/M3/M4)
- 8GB RAM minimum (tight but usable), 16GB+ recommended
- ~10GB free disk space
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

## Quick Start

```bash
git clone https://github.com/aristidesnakos/aiskate.git
cd aiskate
chmod +x setup.sh && ./setup.sh
```

The script installs Ollama, pulls AI models, and starts the stack. When it finishes, open **http://localhost:3000**, create a local account, and start chatting.

## Managing the Stack

```bash
# Stop
docker compose down

# Start
docker compose up -d

# Upgrade
docker compose pull && docker compose up -d

# View logs
docker compose logs -f open-webui

# Pull a larger model (requires 16GB+ RAM — not viable on 8GB machines)
ollama pull mistral-small:24b
```

## Architecture

```
You ── Open WebUI (:3000) ──┬── SearXNG (internal) ── Google, Bing, Brave, arXiv...
                            ├── ChromaDB (built-in RAG)
                            └── Ollama (:11434) ── Metal GPU
```

Ollama runs natively on macOS for direct Metal GPU access. SearXNG runs as hidden infrastructure inside Docker, aggregating multiple search engines for better results. You interact with one URL.

## License

MIT
