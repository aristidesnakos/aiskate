# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**aiskate** is a fully local, private AI assistant for Apple Silicon Macs. One command to install, one URL to use — zero signups, zero cloud dependencies.

**Privacy scope:** All AI inference, documents, and conversation history stay on the machine and never reach any cloud provider. Web search is the one exception — SearXNG proxies queries to public search engines (Google, Bing, etc.) from the user's IP. Web search can be disabled for fully air-gapped operation.

## Architecture

The user interacts with a single URL: **http://localhost:3000** (Open WebUI).

- **Interface**: Open WebUI (port 3000) — chat, web search, document RAG, knowledge bases
- **Search**: SearXNG + Redis (internal, no exposed port) — multi-engine search proxy (Google, Bing, Brave, arXiv, Scholar)
- **Inference**: Ollama (port 11434, native macOS for Metal GPU) — **default and required**; mistral.rs is an optional advanced alternative only
- **Models**: Qwen3-8B (primary chat), Mistral Small 24B (optional heavy lifter), nomic-embed-text (RAG embeddings)

Ollama runs natively on macOS (not Docker) for direct Metal GPU access. SearXNG runs inside Docker with no exposed port — Open WebUI connects to it via the internal Docker network.

## Key Files

- `docker-compose.yml` — Orchestrates Open WebUI, SearXNG, and Redis containers
- `setup.sh` — One-command bootstrap: installs Ollama, pulls models, creates SearXNG config, starts Docker stack, runs health checks
- `searxng/settings.yml` — SearXNG configuration (JSON format must stay enabled for Open WebUI web search)
- `local-ai-stack.jsx` — React component: interactive architecture blueprint/documentation
- `PRD-Local-AI-Stack.md` — Product requirements document (architecture, component specs, execution plan)

## Commands

```bash
# First-time setup (installs Ollama, pulls models, starts everything)
chmod +x setup.sh && ./setup.sh

# Start the stack
docker compose up -d

# Stop the stack
docker compose down

# Upgrade all containers
docker compose pull && docker compose up -d

# Pull additional Ollama models
ollama pull <model-name>
```

## Important Notes

- SearXNG `searxng/settings.yml` must have `json` in the `search.formats` list — Open WebUI depends on JSON API output
- SearXNG has no exposed port — it's internal infrastructure accessible only via the Docker network
- `setup.sh` is macOS-only (checks for Darwin); Linux would need modifications to the Ollama install step
- The JSX file is a standalone React component (uses `useState` from React) — it's documentation/visualization, not part of the runtime stack
