#!/usr/bin/env bash
# Build .dev.vars for local Cloudflare preview from .env.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.local}"
OUT="$ROOT/.dev.vars"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

{
  echo "NEXTJS_ENV=development"
  grep -E '^(OPENROUTERAPIKEY[0-9]+|OPENROUTERAPIKEY|OPENROUTER_API_KEY[0-9]*|OPENROUTERMODEL[0-9]+|OPENROUTER_MODEL[0-9]*|FIRECRAWL_API_KEY|TAVILY_API_KEY|LANGCHAIN_TRACING_V2|LANGCHAIN_API_KEY|LANGCHAIN_PROJECT|MOCK_LLM|MOCK_TOOLS)=' "$ENV_FILE" || true
} > "$OUT"

echo "Wrote $OUT (gitignored — for wrangler/opennext preview only)"
