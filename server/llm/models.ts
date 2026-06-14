import { AGENT_NAMES, type AgentName } from "@/types/agents";

export const OPENROUTER_MODEL_SLOTS = 11;

const MODEL_ENV_NAMES = Array.from(
  { length: OPENROUTER_MODEL_SLOTS },
  (_, i) => `OPENROUTERMODEL${i + 1}` as const
);

/** Default free models ranked fastest → slowest (OpenRouter slugs). */
export const DEFAULT_FAST_FREE_MODELS = [
  "liquid/lfm-2.5-1.2b-instruct:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3.5-content-safety:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-120b:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
] as const;

export type FastFreeModel = (typeof DEFAULT_FAST_FREE_MODELS)[number];

/** Agent index ↔ model slot (1–11). */
export const AGENT_MODEL_SLOT: Record<AgentName, number> = Object.fromEntries(
  AGENT_NAMES.map((agent, index) => [agent, index + 1])
) as Record<AgentName, number>;

/** Not general chat endpoints — excluded from model failover. */
const NON_CHAT_MODELS = new Set<string>([
  "nvidia/nemotron-3.5-content-safety:free",
]);

function readModelSlot(slot: number): string {
  const envName = MODEL_ENV_NAMES[slot - 1];
  const legacyName = `OPENROUTER_MODEL${slot}`;
  const fromEnv = [envName, legacyName]
    .map((name) => process.env[name])
    .find((v) => typeof v === "string" && v.length > 0);

  if (fromEnv) return fromEnv;

  // Legacy single model applies to all slots
  const legacyGlobal = process.env.OPENROUTER_MODEL;
  if (typeof legacyGlobal === "string" && legacyGlobal.length > 0) {
    return legacyGlobal;
  }

  return DEFAULT_FAST_FREE_MODELS[slot - 1];
}

/** All models by slot (1–11), env override or default. */
export function getModelsBySlot(): Map<number, string> {
  const map = new Map<number, string>();
  for (let slot = 1; slot <= OPENROUTER_MODEL_SLOTS; slot++) {
    map.set(slot, readModelSlot(slot));
  }
  return map;
}

export function modelEnvName(slot: number): string {
  return MODEL_ENV_NAMES[slot - 1] ?? `OPENROUTERMODEL${slot}`;
}

export function getPrimaryModelForAgent(agent: AgentName): string {
  const slot = AGENT_MODEL_SLOT[agent];
  return getModelsBySlot().get(slot) ?? DEFAULT_FAST_FREE_MODELS[slot - 1];
}

const INSTRUCT_FALLBACKS = DEFAULT_FAST_FREE_MODELS.filter(
  (m) => !NON_CHAT_MODELS.has(m)
);

/** Primary model for agent, then fastest instruct fallbacks. */
export function getModelChain(agent: AgentName): string[] {
  const primary = getPrimaryModelForAgent(agent);
  const rest = INSTRUCT_FALLBACKS.filter((m) => m !== primary);
  return [...new Set([primary, ...rest])];
}

/** API allows up to 3 models per request with route=fallback. */
export const MODEL_FALLBACK_BATCH = 3;
