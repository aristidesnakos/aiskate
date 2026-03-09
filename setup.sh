#!/bin/bash
##############################################################################
# AISKATE — One-Command Setup
# Fully private AI assistant for Apple Silicon Macs
#
# What this does:
#   1. Checks prerequisites (Docker, Homebrew)
#   2. Installs Ollama (native macOS for Metal GPU)
#   3. Pulls recommended models
#   4. Creates SearXNG configuration
#   5. Starts all services via Docker Compose
#   6. Runs health checks
#
# Usage:
#   chmod +x setup.sh && ./setup.sh
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${GREEN}  ✓${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}  ⚠${NC} $1"
}

print_error() {
    echo -e "${RED}  ✗${NC} $1"
}

##############################################################################
# PHASE 0: Prerequisites
##############################################################################
print_header "Checking prerequisites"

# Check macOS
if [[ "$(uname)" != "Darwin" ]]; then
    print_error "This script is designed for macOS with Apple Silicon."
    print_error "For Linux, modify the Ollama installation step."
    exit 1
fi
print_step "macOS detected"

# Check Apple Silicon
if [[ "$(uname -m)" != "arm64" ]]; then
    print_warn "Not Apple Silicon — Metal GPU acceleration won't be available."
    print_warn "Models will run on CPU (slower but functional)."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Install Docker Desktop for Mac:"
    print_error "  https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    print_error "Docker daemon not running. Start Docker Desktop first."
    exit 1
fi
print_step "Docker is running"

# Check Homebrew
if ! command -v brew &> /dev/null; then
    print_warn "Homebrew not found. Installing Ollama via direct download instead."
    INSTALL_METHOD="direct"
else
    INSTALL_METHOD="brew"
    print_step "Homebrew available"
fi

##############################################################################
# PHASE 1: Install Ollama
##############################################################################
print_header "Setting up Ollama (local LLM runtime)"

if command -v ollama &> /dev/null; then
    print_step "Ollama already installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
else
    if [[ "$INSTALL_METHOD" == "brew" ]]; then
        echo "  Installing Ollama via Homebrew..."
        brew install ollama
    else
        echo "  Installing Ollama via direct download..."
        curl -fsSL https://ollama.com/install.sh | sh
    fi
    print_step "Ollama installed"
fi

# Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "  Starting Ollama..."
    ollama serve &> /dev/null &
    sleep 3
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_step "Ollama server started"
    else
        print_warn "Ollama may need to be started manually. Open the Ollama app."
    fi
else
    print_step "Ollama server already running"
fi

##############################################################################
# PHASE 2: Pull Models
##############################################################################
print_header "Pulling AI models (this may take 5-15 minutes)"

# Primary chat model
echo "  Pulling Qwen3-8B (primary chat model, ~5GB)..."
ollama pull qwen3:8b
print_step "Qwen3-8B ready"

# Embedding model for RAG
echo "  Pulling nomic-embed-text (embedding model for RAG, ~300MB)..."
ollama pull nomic-embed-text
print_step "nomic-embed-text ready"

echo ""
echo -e "${YELLOW}  Optional: For heavier workloads (needs 16GB+ RAM):${NC}"
echo -e "${YELLOW}    ollama pull mistral-small:24b${NC}"

##############################################################################
# PHASE 3: Configure & Launch Docker Stack
##############################################################################
print_header "Starting Docker services"

# Create SearXNG config directory if settings.yml doesn't exist alongside this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/searxng/settings.yml" ]; then
    echo "  Creating SearXNG configuration..."
    mkdir -p "$SCRIPT_DIR/searxng"
    SEARXNG_SECRET=$(openssl rand -hex 32)
    cat > "$SCRIPT_DIR/searxng/settings.yml" << SEARXNG_EOF
use_default_settings: true
general:
  instance_name: "Local AI Search"
  enable_metrics: false
search:
  safe_search: 0
  autocomplete: "google"
  default_lang: "en"
  formats:
    - html
    - json
server:
  secret_key: "${SEARXNG_SECRET}"
  limiter: false
  image_proxy: true
  port: 8080
  bind_address: "0.0.0.0"
SEARXNG_EOF
    print_step "SearXNG config created (secret key auto-generated)"
else
    print_step "SearXNG config exists"
fi

# Start Docker Compose
echo "  Starting services..."
cd "$SCRIPT_DIR"
docker compose up -d

# Wait for services to start
echo "  Waiting for services to initialize..."
sleep 10

##############################################################################
# PHASE 4: Health Checks
##############################################################################
print_header "Running health checks"

# Check Open WebUI
if curl -s "http://localhost:3000" | grep -q "Open WebUI" 2>/dev/null; then
    print_step "Open WebUI: http://localhost:3000 ✓"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "302" ]]; then
        print_step "Open WebUI: http://localhost:3000 ✓ (HTTP $HTTP_CODE)"
    else
        print_warn "Open WebUI may still be starting (HTTP $HTTP_CODE) — give it 60 seconds"
    fi
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags | grep -q "qwen3" 2>/dev/null; then
    print_step "Ollama: qwen3:8b loaded ✓"
else
    print_warn "Ollama: models may still be loading"
fi

##############################################################################
# DONE
##############################################################################
print_header "Setup Complete!"

echo ""
echo -e "  ${GREEN}Your private AI assistant is ready:${NC}"
echo ""
echo -e "  ${BLUE}Open WebUI${NC}  →  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "  ${YELLOW}First-time setup:${NC}"
echo -e "    1. Open http://localhost:3000"
echo -e "    2. Create a local account (stays on your machine)"
echo -e "    3. Start chatting!"
echo ""
echo -e "  ${YELLOW}Features:${NC}"
echo -e "    • AI chat powered by Qwen3-8B (runs on your GPU)"
echo -e "    • Web search across multiple engines (Google, Bing, Brave, and more)"
echo -e "    • Upload documents and ask questions about them (RAG)"
echo -e "    • Build knowledge bases per project"
echo ""
echo -e "  ${YELLOW}To stop:${NC}  docker compose down"
echo -e "  ${YELLOW}To start:${NC} docker compose up -d"
echo ""
