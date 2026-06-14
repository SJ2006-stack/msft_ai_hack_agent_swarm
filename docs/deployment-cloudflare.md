# Deploy to Cloudflare Workers

Production runs on **Cloudflare Workers** with OpenNext. CI deploys on push to `main` via [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml).

## One-time setup

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Create a **KV namespace** for run storage and note its ID
3. Update [`wrangler.jsonc`](../wrangler.jsonc):
   - Set `kv_namespaces[0].id` to your KV namespace ID
   - Adjust `vars` as needed (`MOCK_LLM`, `MOCK_TOOLS`, `OPENROUTER_MODEL`)
4. Create an [OpenRouter API key](https://openrouter.ai/keys)

## Deploy from your machine

```bash
pnpm install

cp .env.example .env.local
# Fill in OPENROUTER_API_KEY (and optional tool keys)

pnpm cf:sync-secrets   # scripts/deploy/cloudflare-sync-secrets.sh
pnpm deploy
```

## Local Cloudflare preview

```bash
pnpm cf:dev-vars   # writes .dev.vars from .env.local
pnpm preview       # opennext build + wrangler preview
```

## GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Worker deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

Upload Worker secrets separately with `pnpm cf:sync-secrets` (not stored in GitHub).

## Scripts

| Command | Script |
|---------|--------|
| `pnpm cf:sync-secrets` | `scripts/deploy/cloudflare-sync-secrets.sh` |
| `pnpm cf:dev-vars` | `scripts/deploy/cloudflare-dev-vars.sh` |
