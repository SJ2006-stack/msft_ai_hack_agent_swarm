import { AGENT_NAMES, type AgentName } from "@/types/agents";

export const OPENROUTER_KEY_SLOTS = 11;

const KEY_ENV_NAMES = Array.from(
  { length: OPENROUTER_KEY_SLOTS },
  (_, i) => `OPENROUTERAPIKEY${i + 1}` as const
);

/** Agent index in AGENT_NAMES ↔ key slot (1–11). */
export const AGENT_KEY_SLOT: Record<AgentName, number> = Object.fromEntries(
  AGENT_NAMES.map((agent, index) => [agent, index + 1])
) as Record<AgentName, number>;

function readKeySlot(slot: number): string | undefined {
  const primary = KEY_ENV_NAMES[slot - 1];
  const legacyUnderscore = `OPENROUTER_API_KEY${slot}`;

  for (const name of [primary, legacyUnderscore]) {
    const value = process.env[name];
    if (typeof value === "string" && value.length > 0) return value;
  }

  return undefined;
}

/** The shared account key — OPENROUTERAPIKEY1 (or legacy OPENROUTER_API_KEY). */
export function getSharedOpenRouterApiKey(): string | undefined {
  const key1 = readKeySlot(1);
  if (key1) return key1;

  for (const legacyName of ["OPENROUTERAPIKEY", "OPENROUTER_API_KEY"] as const) {
    const legacy = process.env[legacyName];
    if (typeof legacy === "string" && legacy.length > 0) return legacy;
  }

  return undefined;
}

/** All configured keys by slot. Unset slots inherit OPENROUTERAPIKEY1. */
export function getOpenRouterKeysBySlot(): Map<number, string> {
  const map = new Map<number, string>();
  const shared = getSharedOpenRouterApiKey();

  for (let slot = 1; slot <= OPENROUTER_KEY_SLOTS; slot++) {
    const key = readKeySlot(slot) ?? shared;
    if (key) map.set(slot, key);
  }

  return map;
}

export function keyEnvName(slot: number): string {
  return KEY_ENV_NAMES[slot - 1] ?? `OPENROUTERAPIKEY${slot}`;
}

/**
 * API key for an agent. When only OPENROUTERAPIKEY1 is set, every agent uses it.
 * Additional keys (OPENROUTERAPIKEY2–11) are only used for failover if configured.
 */
export function getApiKeyChainForAgent(agent: AgentName): Array<{
  slot: number;
  key: string;
  label: string;
}> {
  const bySlot = getOpenRouterKeysBySlot();
  if (bySlot.size === 0) {
    throw new Error(
      "OPENROUTERAPIKEY1 (or OPENROUTER_API_KEY) is required for real LLM calls"
    );
  }

  const uniqueKeys = [...new Set(bySlot.values())];

  // Single shared key → all agents use OPENROUTERAPIKEY1
  if (uniqueKeys.length === 1) {
    const key = uniqueKeys[0];
    return [{ slot: 1, key, label: "OPENROUTERAPIKEY1" }];
  }

  const primarySlot = AGENT_KEY_SLOT[agent];
  const orderedSlots = [
    primarySlot,
    ...Array.from({ length: OPENROUTER_KEY_SLOTS }, (_, i) => i + 1).filter(
      (s) => s !== primarySlot
    ),
  ];

  const chain: Array<{ slot: number; key: string; label: string }> = [];
  const seen = new Set<string>();

  for (const slot of orderedSlots) {
    const key = bySlot.get(slot);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    chain.push({ slot, key, label: keyEnvName(slot) });
  }

  if (chain.length === 0) {
    throw new Error(
      `No OpenRouter API key configured for agent ${agent} (slot ${primarySlot})`
    );
  }

  return chain;
}
