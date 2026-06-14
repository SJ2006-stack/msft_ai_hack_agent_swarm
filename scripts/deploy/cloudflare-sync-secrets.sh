#!/usr/bin/env bash
# Upload secrets from .env.local to the deployed Cloudflare Worker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"\(.*\)"$/\1/' || true
}

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

for i in $(seq 1 11); do
  value="$(read_env "OPENROUTERAPIKEY${i}")"
  if [[ -z "${value:-}" ]]; then
    value="$(read_env "OPENROUTER_API_KEY${i}")"
  fi
  if [[ -n "${value:-}" ]]; then
    printf '%s=%s\n' "OPENROUTERAPIKEY${i}" "$value" >> "$TMP"
  fi
done

for key in FIRECRAWL_API_KEY TAVILY_API_KEY LANGCHAIN_API_KEY; do
  value="$(read_env "$key")"
  if [[ -n "${value:-}" ]]; then
    printf '%s=%s\n' "$key" "$value" >> "$TMP"
  fi
done

# Legacy single-key names → upload as OPENROUTERAPIKEY1 if slot 1 not set
if ! grep -q '^OPENROUTERAPIKEY1=' "$TMP" 2>/dev/null; then
  for legacy in OPENROUTERAPIKEY OPENROUTER_API_KEY; do
    value="$(read_env "$legacy")"
    if [[ -n "${value:-}" ]]; then
      printf '%s=%s\n' "OPENROUTERAPIKEY1" "$value" >> "$TMP"
      break
    fi
  done
fi

if [[ ! -s "$TMP" ]]; then
  echo "No secrets found in $ENV_FILE" >&2
  exit 1
fi

echo "Uploading secrets to Cloudflare Worker (gtmaxxin)..."
pnpm exec wrangler secret bulk "$TMP"
echo "Done. Non-secret vars live in wrangler.jsonc (vars)."
