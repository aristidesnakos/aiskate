import { useState } from "react";

const LAYERS = [
  {
    id: "ui",
    label: "Interface Layer",
    color: "#1a1a2e",
    accent: "#e94560",
    components: [
      {
        name: "Open WebUI",
        repo: "github.com/open-webui/open-webui",
        role: "Your private AI assistant — one URL, everything built in",
        desc: "ChatGPT/Claude-style interface with built-in multi-engine web search (via SearXNG), document upload and RAG, knowledge bases, conversation history, and multi-model switching. Connects to Ollama for local Metal GPU inference.",
        why: "54k+ stars, most mature local AI UI. Native SearXNG + RAG + document upload. No signup needed.",
      },
    ],
  },
  {
    id: "search",
    label: "Search & Retrieval Layer (Internal)",
    color: "#16213e",
    accent: "#0f3460",
    components: [
      {
        name: "SearXNG",
        repo: "github.com/searxng/searxng",
        role: "Multi-engine search — invisible infrastructure",
        desc: "Self-hosted metasearch engine aggregating 247+ search services (Google, Bing, Brave, arXiv, Google Scholar, and more) without tracking. Runs inside Docker with no exposed port — Open WebUI connects to it automatically.",
        why: "15k+ stars. Better search results than any single engine. Runs as hidden infrastructure — users never interact with it directly.",
      },
      {
        name: "ChromaDB (built into Open WebUI)",
        repo: "github.com/chroma-core/chroma",
        role: "Local document RAG — vector database",
        desc: "Open WebUI ships with ChromaDB as its default vector store. Upload PDFs, Word docs, spreadsheets → auto-embedded → query with # prefix in chat. Supports hybrid search (BM25 + semantic) with CrossEncoder reranking.",
        why: "Zero additional setup. Upload your business docs, proposals, research papers. Query them in natural language alongside live web results.",
      },
    ],
  },
  {
    id: "inference",
    label: "Inference Layer",
    color: "#0a0a23",
    accent: "#533483",
    components: [
      {
        name: "Ollama",
        repo: "github.com/ollama/ollama",
        role: "Local LLM runtime — Metal GPU, one-command setup",
        desc: "Native macOS app with Metal GPU acceleration. One-command model management (ollama pull qwen3:8b). OpenAI-compatible API at localhost:11434 with a first-class native connector in Open WebUI. Runs outside Docker to access Metal directly — the only viable path for GPU-accelerated inference on Mac.",
        why: "130k+ stars. Most battle-tested local inference path. Open WebUI has a native Ollama connector. 5 minutes to first chat. Default and recommended.",
        optional: false,
      },
      {
        name: "mistral.rs (Advanced)",
        repo: "github.com/EricLBuehler/mistral.rs",
        role: "Optional: higher-performance Rust inference engine",
        desc: "Drop-in replacement for Ollama. Blazingly fast LLM inference via Rust + Metal. Same OpenAI-compatible API. Supports PagedAttention, auto-tuning (mistralrs tune), and any HuggingFace model. Only relevant if Ollama speed is a bottleneck.",
        why: "Evaluate after the default stack is working. If tokens/second difference is meaningful for your workload, swap it in. Otherwise Ollama wins on ecosystem simplicity.",
        optional: true,
      },
    ],
  },
  {
    id: "models",
    label: "Recommended Models (Apple Silicon)",
    color: "#0d1117",
    accent: "#58a6ff",
    components: [
      {
        name: "Qwen3-8B (Q4)",
        repo: "huggingface.co/Qwen/Qwen3-8B",
        role: "Primary workhorse — research & writing",
        desc: "Best quality-per-GB at the 8B scale. Strong multilingual support (EN, EL, ES, DE, JP — matches your languages). Excellent at synthesis, summarization, and structured writing. ~5GB RAM quantized.",
        why: "Your #1 priority is research synthesis & writing. Qwen3-8B punches well above its weight class here.",
      },
      {
        name: "Mistral Small 3.1 24B (Q4)",
        repo: "huggingface.co/mistralai/Mistral-Small-3.1-24B-Instruct-2503",
        role: "Heavy lifter — business docs & strategy",
        desc: "When 8B isn't enough. Strong reasoning, planning, and long-form document generation. ~14GB RAM quantized. Needs 16GB+ unified memory Mac.",
        why: "Business planning & strategy docs need more horsepower. This is the sweet spot before you need 32GB+ RAM.",
      },
      {
        name: "nomic-embed-text",
        repo: "ollama.com/library/nomic-embed-text",
        role: "Embedding model for RAG",
        desc: "Lightweight embedding model for converting your documents into vectors. Used by Open WebUI's RAG pipeline for semantic search over uploaded files.",
        why: "Tiny footprint, excellent quality. Standard choice for local RAG.",
      },
    ],
  },
];

const ARCHITECTURE_FLOW = [
  { from: "You", to: "Open WebUI", label: "Chat, search, upload docs" },
  { from: "Open WebUI", to: "SearXNG (internal)", label: "Multi-engine web search" },
  { from: "Open WebUI", to: "ChromaDB (internal)", label: "RAG over your documents" },
  { from: "Open WebUI", to: "Ollama (localhost:11434)", label: "LLM inference (Metal GPU)" },
  { from: "SearXNG", to: "Google, Bing, Brave...", label: "Aggregated search results" },
];

const SETUP_STEPS = [
  {
    phase: "Phase 1 — Running in 10 minutes",
    steps: [
      "git clone https://github.com/aristidesnakos/aiskate.git && cd aiskate",
      "chmod +x setup.sh && ./setup.sh",
      "The script installs Ollama, pulls models, and starts everything",
      "Open http://localhost:3000 → create local account (never leaves your machine)",
      "Start chatting — web search and RAG are pre-configured ✓",
    ],
  },
  {
    phase: "Phase 2 — Local RAG over your documents",
    steps: [
      "In Open WebUI → Workspace → Knowledge → create a collection",
      "Upload your business docs, research PDFs, proposals",
      "In any chat, type # → select your knowledge base",
      "Ask questions that combine your docs + live web results",
      "Private knowledge assistant ✓",
    ],
  },
  {
    phase: "Phase 3 (Advanced / Optional) — mistral.rs for maximum performance",
    steps: [
      "Install → curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/EricLBuehler/mistral.rs/master/install.sh | sh",
      "Auto-tune → mistralrs tune -m Qwen/Qwen3-8B --emit-config config.toml",
      "Serve → mistralrs serve --ui -m Qwen/Qwen3-8B --port 8000",
      "Point Open WebUI → Admin Panel → Connections → add OpenAI-compat at http://localhost:8000/v1",
      "Compare speed vs Ollama — keep whichever feels better",
      "Maximum Apple Silicon performance ✓",
    ],
  },
];

const TRADEOFFS = {
  "mistral.rs": {
    pros: [
      "Faster inference on Apple Silicon (Rust + Metal optimized)",
      "Fine-grained quantization control (pick exact quant format)",
      "Built-in auto-tuning for your specific hardware",
      "MCP client support for tool calling",
      "Serves any HuggingFace model directly (no conversion)",
    ],
    cons: [
      "Requires Rust toolchain to build from source (or use install script)",
      "Smaller community, fewer troubleshooting resources",
      "Open WebUI connects via generic OpenAI-compat (no native connector)",
      "Model management is more manual than ollama pull",
    ],
  },
  Ollama: {
    pros: [
      "5-minute setup, native macOS app",
      "ollama pull model — dead simple model management",
      "Native connector in Open WebUI (not just OpenAI-compat)",
      "Massive community, every tutorial assumes Ollama",
      "Modelfile system for custom system prompts and parameters",
    ],
    cons: [
      "Slightly lower throughput than mistral.rs on same hardware",
      "Less granular quantization control",
      "Go-based (less optimized memory management than Rust)",
      "Model library is curated — not every HuggingFace model available",
    ],
  },
};

export default function LocalAIStack() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [view, setView] = useState("architecture");
  const [expandedPhase, setExpandedPhase] = useState(0);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#0a0a0f",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "24px",
      maxWidth: "100%",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, borderBottom: "1px solid #222", paddingBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#e94560", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
          aiskate — Architecture Blueprint
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          lineHeight: 1.2,
        }}>
          Private AI Assistant
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 8, lineHeight: 1.5 }}>
          One command · One URL · Zero signups · Zero cloud dependencies · Apple Silicon optimized
        </p>
        <p style={{ fontSize: 11, color: "#555", marginTop: 6, lineHeight: 1.4 }}>
          Interactive documentation — not part of the runtime stack. Open in any React sandbox to explore. See <code>docker-compose.yml</code> and <code>setup.sh</code> for deployment.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { id: "architecture", label: "Stack Overview" },
          { id: "flow", label: "Data Flow" },
          { id: "tradeoffs", label: "Advanced: mistral.rs" },
          { id: "setup", label: "Setup Guide" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              background: view === tab.id ? "#e94560" : "transparent",
              color: view === tab.id ? "#fff" : "#888",
              border: `1px solid ${view === tab.id ? "#e94560" : "#333"}`,
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Architecture View */}
      {view === "architecture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              style={{
                background: layer.color,
                border: `1px solid ${activeLayer === layer.id ? layer.accent : "#1a1a2e"}`,
                borderRadius: 8,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={() => setActiveLayer(layer.id)}
              onMouseLeave={() => { setActiveLayer(null); setActiveComponent(null); }}
            >
              <div style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${layer.accent}22`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: layer.accent,
                  boxShadow: `0 0 8px ${layer.accent}66`,
                }} />
                <span style={{ fontSize: 11, color: layer.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
                  {layer.label}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 12 }}>
                {layer.components.map((comp) => {
                  const isActive = activeComponent === comp.name;
                  return (
                    <div
                      key={comp.name}
                      onClick={() => setActiveComponent(isActive ? null : comp.name)}
                      style={{
                        flex: "1 1 280px",
                        minWidth: 280,
                        background: isActive ? `${layer.accent}15` : "#0d0d1a",
                        border: `1px solid ${isActive ? layer.accent : "#1a1a2e"}`,
                        borderRadius: 6,
                        padding: 14,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{comp.name}</div>
                        <div style={{
                          fontSize: 9,
                          color: layer.accent,
                          border: `1px solid ${layer.accent}44`,
                          padding: "2px 6px",
                          borderRadius: 3,
                          whiteSpace: "nowrap",
                        }}>
                          {comp.optional ? "OPTIONAL" : "CORE"}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: layer.accent, marginBottom: 8, fontStyle: "italic" }}>
                        {comp.role}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6, marginTop: 8 }}>
                          <p style={{ margin: "0 0 8px 0" }}>{comp.desc}</p>
                          <div style={{
                            background: "#0a0a15",
                            border: "1px solid #222",
                            borderRadius: 4,
                            padding: "8px 10px",
                            fontSize: 11,
                          }}>
                            <span style={{ color: "#e94560" }}>Why this: </span>
                            <span style={{ color: "#999" }}>{comp.why}</span>
                          </div>
                          <div style={{ marginTop: 8, fontSize: 10, color: "#555" }}>
                            ↗ {comp.repo}
                          </div>
                        </div>
                      )}
                      {!isActive && (
                        <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Click to expand</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Flow View */}
      {view === "flow" && (
        <div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 20, lineHeight: 1.6 }}>
            Everything runs on <span style={{ color: "#e94560" }}>localhost</span>.
            You interact with one URL: <span style={{ color: "#58a6ff" }}>localhost:3000</span>.
            The only external calls are search queries to public engines (Google, Bing, Brave, etc.)
            for live web results. Your documents and LLM conversations never leave your machine.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ARCHITECTURE_FLOW.map((flow, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: i % 2 === 0 ? "#0d0d1a" : "#0a0a15",
                  borderRadius: 6,
                  border: "1px solid #1a1a2e",
                }}
              >
                <div style={{
                  minWidth: 140,
                  fontSize: 12,
                  color: flow.from === "You" ? "#e94560" : "#58a6ff",
                  fontWeight: 600,
                }}>
                  {flow.from}
                </div>
                <div style={{ color: "#333", fontSize: 16 }}>→</div>
                <div style={{
                  minWidth: 160,
                  fontSize: 12,
                  color: "#fff",
                  fontWeight: 500,
                }}>
                  {flow.to}
                </div>
                <div style={{ fontSize: 11, color: "#666", fontStyle: "italic" }}>
                  {flow.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 24,
            padding: 16,
            background: "#0d0d1a",
            border: "1px solid #e9456033",
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>
              ONE URL, EVERYTHING BUILT IN
            </div>
            <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7 }}>
              <strong style={{ color: "#ccc" }}>Open WebUI</strong> (localhost:3000) is your private AI assistant.
              Chat, upload documents, build knowledge bases, get web-augmented answers with citations.
              <br /><br />
              Web search is powered by <strong style={{ color: "#ccc" }}>SearXNG</strong> running as invisible infrastructure —
              aggregating results from Google, Bing, Brave, arXiv, Google Scholar, and more.
              You get multi-engine search quality without managing a separate service.
              <br /><br />
              LLM inference runs on <strong style={{ color: "#ccc" }}>Ollama</strong> with Metal GPU acceleration.
              One command to install, one URL to use.
            </div>
          </div>
        </div>
      )}

      {/* Tradeoffs View */}
      {view === "tradeoffs" && (
        <div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 20, lineHeight: 1.6 }}>
            <span style={{ color: "#58a6ff" }}>Ollama</span> is the default inference backend.
            <span style={{ color: "#e94560" }}> mistral.rs</span> is an optional drop-in replacement for users who need maximum performance.
            Both expose an OpenAI-compatible API — swapping one for the other requires no changes to the rest of the stack.
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(TRADEOFFS).map(([name, data]) => (
              <div
                key={name}
                style={{
                  flex: "1 1 300px",
                  background: "#0d0d1a",
                  border: "1px solid #1a1a2e",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: name === "mistral.rs" ? "#e94560" : "#58a6ff",
                  marginBottom: 16,
                }}>
                  {name}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#4caf50", letterSpacing: 1, marginBottom: 8 }}>STRENGTHS</div>
                  {data.pros.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#bbb", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #4caf5044", lineHeight: 1.5 }}>
                      {p}
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: 10, color: "#ff9800", letterSpacing: 1, marginBottom: 8 }}>TRADEOFFS</div>
                  {data.cons.map((c, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#888", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #ff980044", lineHeight: 1.5 }}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 20,
            padding: 16,
            background: "#1a1a2e",
            borderRadius: 8,
            border: "1px solid #333",
          }}>
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, marginBottom: 8 }}>
              RECOMMENDATION
            </div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              Start with <strong>Ollama</strong> — full stack working in 10 minutes.
              Only evaluate <strong>mistral.rs</strong> if Ollama speed is a bottleneck.
              Run both on the same prompt, compare tokens/second. If the difference is meaningful for your workload, keep mistral.rs.
              If not, Ollama's ecosystem convenience wins. You're not locked in — both speak the same API.
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide View */}
      {view === "setup" && (
        <div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 20, lineHeight: 1.6 }}>
            Prerequisites: <span style={{ color: "#58a6ff" }}>Docker Desktop for Mac</span>.
            That's it. The setup script handles everything else.
          </div>

          {SETUP_STEPS.map((phase, phaseIdx) => (
            <div
              key={phaseIdx}
              style={{
                marginBottom: 12,
                background: "#0d0d1a",
                border: `1px solid ${expandedPhase === phaseIdx ? "#e94560" : "#1a1a2e"}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? -1 : phaseIdx)}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {phase.phase}
                </div>
                <div style={{ color: "#555", fontSize: 18 }}>
                  {expandedPhase === phaseIdx ? "−" : "+"}
                </div>
              </div>

              {expandedPhase === phaseIdx && (
                <div style={{ padding: "0 16px 16px" }}>
                  {phase.steps.map((step, stepIdx) => (
                    <div
                      key={stepIdx}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "10px 0",
                        borderTop: stepIdx > 0 ? "1px solid #111" : "none",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1px solid #333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#666",
                        marginTop: 1,
                      }}>
                        {stepIdx + 1}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: "#ccc",
                        lineHeight: 1.6,
                        fontFamily: step.includes("→") && step.includes("docker") || step.includes("brew") || step.includes("ollama") || step.includes("curl") || step.includes("mistralrs")
                          ? "'IBM Plex Mono', monospace"
                          : "inherit",
                      }}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{
            marginTop: 20,
            padding: 16,
            background: "#0a1a0a",
            border: "1px solid #2a4a2a",
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: "#4caf50", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
              TOTAL RESOURCE FOOTPRINT
            </div>
            <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7 }}>
              Qwen3-8B (Q4): ~5GB RAM &nbsp;|&nbsp; Mistral Small 24B (Q4): ~14GB RAM &nbsp;|&nbsp;
              nomic-embed-text: ~300MB &nbsp;|&nbsp; Open WebUI + SearXNG: ~750MB combined
              <br />
              <strong style={{ color: "#ccc" }}>Minimum viable:</strong> 8GB Mac (8B model only — close other apps)
              <br />
              <strong style={{ color: "#ccc" }}>Comfortable:</strong> 16GB Mac (8B model with full RAG + web search)
              <br />
              <strong style={{ color: "#ccc" }}>Recommended:</strong> 32GB+ Mac (24B model + RAG + web search simultaneously)
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 40,
        paddingTop: 16,
        borderTop: "1px solid #1a1a2e",
        fontSize: 10,
        color: "#444",
        lineHeight: 1.6,
      }}>
        All components: MIT or AGPL licensed · No API keys · No signups · No cloud dependencies
        <br />
        Data stays on your Mac · Models run on Apple Silicon Metal · Web search proxied through SearXNG
      </div>
    </div>
  );
}
