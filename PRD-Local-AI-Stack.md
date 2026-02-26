# Product Requirements Document: Local-First Private AI Workstation

> A fully private, open-source AI assistant for Apple Silicon Macs. One command to install, one URL to use — zero signups, zero cloud dependencies.

| Field | Value |
|-------|-------|
| Author | Ari / The Auspicious Company |
| Version | 1.0 |
| Date | February 21, 2026 |
| Status | Proposed |
| Target Hardware | Apple Silicon Mac (M1/M2/M3/M4), 8GB+ RAM (16GB+ recommended) |
| Classification | Internal / Private |

---

## 1. Executive Summary

This PRD defines the architecture, component selection, and deployment plan for a fully private, locally-hosted AI assistant that replicates the core functionality of Claude (Anthropic) without requiring any cloud accounts, API keys, or external service signups.

The system runs entirely on an Apple Silicon Mac, leveraging the Metal GPU for fast inference. The user interacts with a single URL (localhost:3000) backed by Open WebUI, with multi-engine web search and document RAG running as invisible infrastructure.

### 1.1 Problem Statement

Current AI workflows depend on cloud services that require account creation, incur usage costs, and transmit sensitive business data to third-party servers. For confidential work involving business strategy, client information, or proprietary research, this creates unacceptable privacy and data sovereignty risks. Additionally, cloud services can change pricing, throttle usage, or discontinue features without notice.

### 1.2 Proposed Solution

A self-hosted AI assistant (Open WebUI) backed by locally-running language models, privacy-preserving multi-engine web search, and retrieval-augmented generation over private documents. One command to install, one URL to use.

### 1.3 Key Constraints

- **Zero signups:** No accounts, API keys, or registration of any kind
- **Zero cloud dependency:** All AI inference runs locally on Apple Silicon
- **Privacy-first:** Queries, documents, and conversations never leave the local machine
- **Open-source only:** MIT, Apache 2.0, or AGPL-licensed components
- **Exception:** SearXNG proxies queries to public search engines (Google, Bing, etc.) for live web results. This is configurable and can be disabled for fully air-gapped operation.

---

## 2. User Personas and Jobs to Be Done

### 2.1 Primary Persona

**Ari** — Fractional CTO, multilingual (EN/EL/ES/DE/JP), running a MacBook Pro M2 with 8GB unified memory. Works with sensitive client strategy, business planning, and technical research. Needs an AI assistant that handles research synthesis, long-form writing, business document generation, and general Q&A without transmitting data to cloud providers.

### 2.2 Priority-Ranked Jobs to Be Done

| Priority | Job | Current Tool | Local Replacement | Quality Target |
|----------|-----|-------------|-------------------|----------------|
| P0 | Research synthesis and writing | Claude | Open WebUI + SearXNG + RAG | 80% of Claude quality |
| P1 | Business planning and strategy docs | Claude | Open WebUI + Qwen3-8B (24B model on 16GB+ Macs) | 75% of Claude quality |
| P2 | Conversational Q&A / general assistant | Claude | Open WebUI + Qwen3-8B | 70% of Claude quality |
| P3 | Coding assistance and code generation | Claude | Open WebUI + code-focused model | 60% of Claude quality |
| P0 | AI-powered web research with citations | Perplexity | Open WebUI + SearXNG | 85% of Perplexity quality |

*Quality targets are subjective estimates based on community benchmarks of local models vs. frontier cloud models. The gap narrows significantly for RAG-augmented tasks (research, document Q&A) where retrieved context compensates for model capability differences.*

---

## 3. System Architecture

The stack is organized into four layers. Each layer can be independently upgraded or replaced without affecting the others, because all inter-component communication uses the OpenAI-compatible API standard.

### 3.1 Architecture Layers

| Layer | Component | Role | Port |
|-------|-----------|------|------|
| Interface | Open WebUI | AI assistant: chat, RAG, web search, docs | localhost:3000 |
| Search | SearXNG + Redis | Privacy-first web search proxy (247+ engines) | (internal) |
| Search | ChromaDB (built into Open WebUI) | Vector database for local document RAG | (internal) |
| Inference | Ollama (recommended) | Local LLM runtime with Metal GPU acceleration | localhost:11434 |
| Inference | mistral.rs (optional) | High-performance Rust inference engine | localhost:8000 |
| Models | Qwen3-8B (Q4) | Primary workhorse model (~5GB RAM, tight on 8GB Macs) | (loaded by runtime) |
| Models | Mistral Small 3.1 24B (Q4) | Heavy-duty model for complex tasks (~14GB RAM, requires 16GB+) | (loaded by runtime) |
| Models | nomic-embed-text | Embedding model for RAG pipeline (~300MB) | (loaded by runtime) |

### 3.2 Data Flow

All communication occurs on localhost. The only external network calls are from SearXNG to public search engines for live web results. The user controls which engines are enabled and can fully disable web search for air-gapped operation.

1. **User → Open WebUI (localhost:3000):** Chat, upload documents, query knowledge bases, request web-augmented answers
2. **Open WebUI → SearXNG (internal):** Multi-engine web search (Google, Bing, Brave, arXiv, Scholar), results injected into LLM context
3. **Open WebUI → ChromaDB (internal):** Semantic search over uploaded private documents
4. **Open WebUI → Ollama/mistral.rs:** LLM inference via OpenAI-compatible API

### 3.3 Key Architectural Decisions

**Decision 1: Ollama runs natively on macOS, not in Docker.**

Ollama must run as a native macOS process to access the Metal GPU. Docker on Mac does not pass through GPU access. Docker containers connect to Ollama via `host.docker.internal:11434`.

**Decision 2: SearXNG is invisible infrastructure, not a user-facing service.**

SearXNG runs inside Docker with no exposed port. Open WebUI connects to it via the internal Docker network. Users get multi-engine search quality (Google, Bing, Brave, arXiv, Scholar) without knowing SearXNG exists. This keeps the product simple — one URL — while delivering better search results than any single engine.

**Decision 3: Single interface — Open WebUI only.**

Open WebUI provides chat, web search, document RAG, and knowledge bases in one interface. A single UI eliminates the confusion of multiple endpoints and reduces post-setup configuration to zero. Web search with citations is built into Open WebUI's RAG pipeline.

---

## 4. Component Specifications

### 4.1 Open WebUI — Claude Replacement

| Attribute | Detail |
|-----------|--------|
| Repository | [github.com/open-webui/open-webui](https://github.com/open-webui/open-webui) (54k+ stars) |
| License | MIT |
| Purpose | Full-featured AI chat interface with RAG, web search, and document management |
| Docker Image | `ghcr.io/open-webui/open-webui:main` |
| Resource Usage | ~500MB RAM, <1GB disk |

**Key capabilities that map to Claude features:**

- Multi-turn conversational chat with conversation history and search
- Document upload and RAG: PDFs, Word, Excel, PowerPoint, with 9 vector DB options
- Web search integration via SearXNG (15+ search providers supported)
- Knowledge bases: organized document collections queryable via `#` prefix
- Multi-model switching: swap between models mid-conversation
- Built-in citation system for RAG-sourced content
- Web browsing: paste URLs directly into chat via `#` prefix
- Admin panel for configuring all settings without editing config files

### 4.2 SearXNG — Search Infrastructure (Internal)

| Attribute | Detail |
|-----------|--------|
| Repository | [github.com/searxng/searxng](https://github.com/searxng/searxng) (15k+ stars) |
| License | AGPL-3.0 |
| Purpose | Privacy-first metasearch engine aggregating 247+ search services |
| Docker Image | `docker.io/searxng/searxng:latest` |
| Resource Usage | ~200MB RAM with Redis cache |

SearXNG runs as internal Docker infrastructure with no exposed port. Open WebUI connects to it via the Docker network. JSON output format must be enabled in `searxng/settings.yml` — the provided configuration includes this.

### 4.3 Inference Runtime — Ollama vs. mistral.rs

Both runtimes expose an OpenAI-compatible HTTP API, making them interchangeable. The recommendation is to start with Ollama and optionally evaluate mistral.rs for performance-critical workloads.

| Dimension | Ollama (Recommended) | mistral.rs (Optional) |
|-----------|---------------------|----------------------|
| Setup time | 5 minutes (`brew install`) | 15–30 minutes (Rust build or install script) |
| Model management | `ollama pull model` (one command) | Manual HuggingFace download or auto-fetch |
| Apple Silicon | Metal GPU via native macOS app | Metal via feature flag (`--features metal`) |
| UI integration | Native connector in Open WebUI | OpenAI-compat API only (generic connector) |
| Performance | Good (Go-based runtime) | Better (Rust + PagedAttention + FlashAttention) |
| Quantization | Predefined quant levels per model | Fine-grained control, custom UQFF format |
| Community | Massive (130k+ GitHub stars) | Growing (6.3k stars) |
| Auto-tuning | No | Yes (`mistralrs tune` benchmarks your hardware) |
| MCP support | No | Yes (built-in MCP client and server) |
| **Recommendation** | **Start here.** Ecosystem convenience wins for initial deployment. | **Evaluate later.** Swap in if speed difference matters for your workload. |

---

## 5. Model Selection Rationale

Model selection is constrained by Apple Silicon unified memory (RAM = VRAM). The following models are recommended based on quality-per-GB for the target use cases, with explicit consideration for multilingual capability (EN, EL, ES, DE, JP).

### 5.1 Qwen3-8B — Primary Model

| Attribute | Detail |
|-----------|--------|
| Parameters | 8 billion |
| Quantized Size | ~5GB (Q4_K_M) |
| Minimum RAM | 8GB (tight), 16GB (comfortable) |
| Strengths | Multilingual (30+ languages including Greek, Japanese), strong reasoning, excellent synthesis and summarization |
| Weaknesses | Struggles with very long multi-step planning, complex code generation |
| Install | `ollama pull qwen3:8b` |

Qwen3-8B is the best quality-per-GB model available in early 2026 for research synthesis and writing tasks. It significantly outperforms Mistral-7B and Llama-3.1-8B on multilingual benchmarks and instruction following, which directly maps to the primary use case (P0: research synthesis and writing).

### 5.2 Mistral Small 3.1 24B — Heavy Duty (16GB+ RAM Only)

| Attribute | Detail |
|-----------|--------|
| Parameters | 24 billion |
| Quantized Size | ~14GB (Q4_K_M) |
| Minimum RAM | 16GB (tight), 32GB (comfortable) |
| Strengths | Strong reasoning, planning, long-form document generation, multilingual (FR, DE, ES, IT) |
| Weaknesses | Requires significant RAM, slower inference on 16GB Macs |
| Install | `ollama pull mistral-small:24b` |

> **Not viable on 8GB Macs.** The model alone requires ~14GB of RAM, exceeding the total unified memory on 8GB machines. This model is documented here for users with 16GB+ RAM who want stronger reasoning for business planning and strategy documents (P1).

Use this model when Qwen3-8B produces insufficient quality for complex tasks and you have sufficient RAM. The 24B parameter count provides noticeably better reasoning and document structure, but at the cost of higher RAM usage and slower generation.

### 5.3 nomic-embed-text — RAG Embeddings

A lightweight embedding model (~300MB) specifically designed for retrieval-augmented generation. It converts uploaded documents into vector representations stored in ChromaDB, enabling semantic search over private files. This model runs alongside the chat model with negligible additional resource usage.

### 5.4 Model Upgrade Path

As Apple Silicon Macs with 64GB+ RAM become common and model quality improves, the following upgrade path is anticipated:

- **Near-term (2026):** Qwen3-14B or Qwen3-32B when available, offering better quality in the same architecture
- **Mid-term:** Mixtral-style MoE models that provide 70B-class quality at 14B-class speed
- **Model switching:** Both Ollama and mistral.rs support hot-swapping models. No architecture changes needed.

---

## 6. Deployment Specification

### 6.1 Prerequisites

| Requirement | Details | Verification |
|-------------|---------|--------------|
| macOS | 13.0+ (Ventura or later) | `sw_vers` |
| Apple Silicon | M1, M2, M3, or M4 series | `uname -m` (expect arm64) |
| RAM | 8GB minimum (tight with 8B model), 16GB+ recommended | `sysctl hw.memsize` |
| Disk Space | ~10GB for models + containers | `df -h` |
| Docker Desktop | 4.0+ for Mac | `docker --version` |
| Homebrew | Optional (for Ollama install) | `brew --version` |

### 6.2 Docker Compose Configuration

The `docker-compose.yml` orchestrates three services. Ollama runs natively on the host for Metal GPU access.

```yaml
services:
  searxng:           # Internal — multi-engine search proxy (no exposed port)
  redis:             # Internal — cache for SearXNG
  open-webui:        # localhost:3000 — the user-facing AI assistant

# Ollama runs natively: brew install ollama
# Models: ollama pull qwen3:8b && ollama pull nomic-embed-text
```

See `docker-compose.yml` for the complete configuration.

### 6.3 Execution Plan

There are two deployment paths: automated (recommended) and manual. Both achieve the same result. The automated path runs all phases sequentially via a single script.

#### Automated Path (Recommended)

```bash
git clone https://github.com/aristidesnakos/aiskate.git && cd aiskate
chmod +x setup.sh && ./setup.sh
```

The script handles: prerequisite checks → Ollama install → model pulls → SearXNG config creation → `docker compose up -d` → health checks. When it finishes, open localhost:3000, create an account, and start chatting.

#### Manual Path

**Phase 1: Install + Chat (15 minutes)**

*Prerequisites:* Docker Desktop running, Homebrew installed.

1. Install Ollama: `brew install ollama`
2. Start Ollama (if not auto-started): open the Ollama app or run `ollama serve`
3. Pull models: `ollama pull qwen3:8b && ollama pull nomic-embed-text`
4. Start all services: `docker compose up -d`
5. Wait ~30 seconds for services to initialize
6. Open `http://localhost:3000` and create a local account (first user becomes admin)

*Verification:*
- Open WebUI responds: open `http://localhost:3000` (should show registration page)
- Ollama has models: `curl -s http://localhost:11434/api/tags` (should list `qwen3:8b`)
- Web search works: ask a question with the web search toggle enabled

**Outcome:** Functional AI assistant with chat, multi-engine web search, and document RAG.

*Troubleshooting:*
- Web search returns no results → verify `searxng/settings.yml` has `json` in `search.formats`; check `docker compose logs searxng`
- Open WebUI can't reach Ollama → confirm Ollama is running (`curl http://localhost:11434`), check Docker's `host.docker.internal` resolution
- Docker containers won't start → check `docker compose logs <service>` for errors; ensure port 3000 is free

**Phase 2: Local RAG — Document Knowledge Bases (10 minutes)**

1. In Open WebUI: Workspace → Knowledge → Create collection
2. Upload business documents (PDFs, Word, Excel, PowerPoint)
3. In any chat, type `#` to select a knowledge base, then ask questions
4. Create per-project collections as needed

*Verification:* Ask a specific question about an uploaded document; the answer should reference the document content with citations.

**Outcome:** Private knowledge assistant combining local documents with live web results.

**Phase 3: Performance Optimization (Optional, 30 minutes)**

Only pursue this if inference speed with Ollama is insufficient for your workload. mistral.rs is a drop-in replacement for the inference layer — no changes to the rest of the stack.

```bash
# Install mistral.rs
curl --proto '=https' --tlsv1.2 -sSf \
  https://raw.githubusercontent.com/EricLBuehler/mistral.rs/master/install.sh | sh

# Auto-tune for your hardware
mistralrs tune -m Qwen/Qwen3-8B --emit-config config.toml

# Start server
mistralrs serve --ui -m Qwen/Qwen3-8B --port 8000

# Add to Open WebUI: Admin → Connections → OpenAI-compat
# URL: http://localhost:8000/v1
```

*Verification:* Compare tokens/second between Ollama and mistral.rs on the same prompt. If mistral.rs is noticeably faster, keep it; otherwise, Ollama's ecosystem convenience wins.

---

## 7. Resource Requirements

| Component | RAM | Disk | Network |
|-----------|-----|------|---------|
| Qwen3-8B (Q4) | ~5GB | ~5GB | None (local) |
| Mistral Small 24B (Q4) | ~14GB | ~14GB | None (local) |
| nomic-embed-text | ~300MB | ~300MB | None (local) |
| Open WebUI | ~500MB | ~1GB | LAN only |
| SearXNG + Redis | ~250MB | ~500MB | Outbound to search engines |
| **Total (8B model)** | **~6GB** (leaves ~2GB for macOS on 8GB machines) | **~7GB** | **Minimal outbound** |
| **Total (24B model)** | **~15GB** | **~16GB** | **Minimal outbound** |

### 7.1 Hardware Configurations

| Mac Config | 8B Model | 24B Model | RAG + Web Search |
|------------|----------|-----------|------------------|
| 8GB RAM | Tight, usable | Not viable | Minimal docs only |
| 16GB RAM | Comfortable | Tight but works | Full capability |
| 32GB RAM | Excellent | Comfortable | Full capability |
| 64GB+ RAM | Excellent | Excellent | Large document collections |

> **Target configuration:** This project is designed and tested on an 8GB Apple Silicon Mac (MacBook Pro M2). The 8GB row above reflects the primary target hardware. Performance is tight but usable for the 8B model with light RAG usage. Close memory-heavy applications (browsers, IDEs) before running inference for best results.

---

## 8. Risks and Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Model quality gap vs. Claude/GPT-4 | Medium | High | RAG compensates for model limitations; upgrade models as better ones release |
| SearXNG blocked by search engines | Low | Medium | Enable multiple engines; personal instance has low request volume |
| Docker resource contention on 8GB Mac | Medium | High | Run only 8B model; close memory-heavy apps; keep Docker memory allocation at default |
| Open WebUI breaking updates | Low | Low | Pin Docker image versions in production; test before upgrading |
| mistral.rs build failures on macOS | Low | Medium | Ollama is the primary path; mistral.rs is optional enhancement |
| Ollama model availability | Low | Low | HuggingFace GGUF models can be loaded directly via Ollama Modelfile |

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first chat | < 15 minutes from git clone | Timed setup on clean Mac |
| Research query quality | Cited answers comparable to Perplexity Free | Side-by-side comparison on 10 queries |
| Document Q&A accuracy | Correct answers on 80%+ of questions about uploaded docs | Test with known business documents |
| Inference speed (8B) | > 15 tokens/second on M1/M2 base | Measured via Open WebUI response time |
| Daily usability | Replaces Claude for 70%+ of daily tasks within 2 weeks | Self-reported usage tracking |
| Privacy compliance | Zero external data transmission except SearXNG queries | Network traffic audit via Little Snitch or similar |

---

## 10. Appendix

### 10.1 Repository References

| Component | Repository | Stars | License |
|-----------|-----------|-------|---------|
| Open WebUI | [github.com/open-webui/open-webui](https://github.com/open-webui/open-webui) | 54k+ | MIT |
| SearXNG | [github.com/searxng/searxng](https://github.com/searxng/searxng) | 15k+ | AGPL-3.0 |
| Ollama | [github.com/ollama/ollama](https://github.com/ollama/ollama) | 130k+ | MIT |
| mistral.rs | [github.com/EricLBuehler/mistral.rs](https://github.com/EricLBuehler/mistral.rs) | 6.3k+ | MIT |
| ChromaDB | [github.com/chroma-core/chroma](https://github.com/chroma-core/chroma) | 18k+ | Apache-2.0 |

### 10.2 File Manifest

This PRD is accompanied by the following deployment files:

- **docker-compose.yml:** Docker Compose configuration (Open WebUI + SearXNG + Redis)
- **searxng/settings.yml:** SearXNG configuration with JSON format enabled
- **setup.sh:** One-command setup script
- **local-ai-stack.jsx:** Interactive architecture diagram (React component)

### 10.3 Maintenance Commands

```bash
# Start the stack
docker compose up -d

# Stop the stack
docker compose down

# Update all containers
docker compose pull && docker compose up -d

# Update Ollama models
ollama pull qwen3:8b

# View logs
docker compose logs -f open-webui

# Backup Open WebUI data
docker cp open-webui:/app/backend/data ./backup/
```

---

*— End of Document —*
