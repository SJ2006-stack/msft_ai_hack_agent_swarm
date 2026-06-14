/**
 * Cloudflare Worker secrets and vars live on `env`, not Node's `.env.local`.
 * OpenNext copies them to `process.env` on the first request, but background
 * work (waitUntil) should re-sync at run start so API keys are always present.
 */
export function syncEnvFromCloudflare(env: unknown): void {
  if (!env || typeof env !== "object") return;

  for (const [key, value] of Object.entries(env as Record<string, unknown>)) {
    if (typeof value === "string" && value.length > 0) {
      process.env[key] = value;
    }
  }
}
