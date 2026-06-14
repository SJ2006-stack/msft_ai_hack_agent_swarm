import type { AgentName } from "@/types/agents";
import { logAgent } from "@/swarm/shared/agent-logger";
import { isMockLLM } from "@/swarm/tools/mock";
import { getApiKeyChainForAgent } from "@/server/llm/keys";
import {
  getModelChain,
  MODEL_FALLBACK_BATCH,
} from "@/server/llm/models";

const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

const AGENT_MAX_TOKENS: Partial<Record<AgentName, number>> = {
  gtm_strategist: 2048,
  market_mapper: 2048,
  signal_hunter: 2048,
  prospect_discovery: 2048,
  decision_maker_finder: 1536,
  opportunity_scorer: 1536,
  outreach_planner: 3072,
  report_assembler: 512,
};

function isRetryableStatus(status: number): boolean {
  return status === 401 || status === 402 || status === 403 || status === 429 || status >= 500;
}

type ChatChunk = {
  choices?: Array<{ delta?: { content?: string } }>;
  error?: { code?: number; message?: string };
};

async function streamCompletion(
  apiKey: string,
  models: string[],
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  agent?: AgentName
): Promise<string> {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gtmaxxin.app",
      "X-Title": "GTMaxxin",
    },
    body: JSON.stringify({
      models,
      route: "fallback",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      stream: true,
      provider: { sort: "latency" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }

  if (!response.body) {
    throw new Error("Empty response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let chunk: ChatChunk;
      try {
        chunk = JSON.parse(payload) as ChatChunk;
      } catch {
        continue;
      }

      if (chunk.error) {
        const msg = `LLM error (${chunk.error.code}): ${chunk.error.message}`;
        if (agent) logAgent(agent, "error", "LLM stream error", msg);
        throw new Error(msg);
      }

      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) content += delta;
    }
  }

  if (!content.trim()) {
    throw new Error("Empty response from LLM");
  }

  return content;
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    agent?: AgentName;
  }
): Promise<string> {
  if (isMockLLM()) {
    throw new Error("callLLM should not be called in MOCK_LLM mode");
  }

  const agent = options?.agent ?? "gtm_strategist";
  const maxTokens =
    options?.maxTokens ?? (AGENT_MAX_TOKENS[agent] ?? 2048);

  const modelChain = getModelChain(agent);
  const keyChain = getApiKeyChainForAgent(agent);

  const modelBatches: string[][] = [];
  for (let i = 0; i < modelChain.length; i += MODEL_FALLBACK_BATCH) {
    modelBatches.push(modelChain.slice(i, i + MODEL_FALLBACK_BATCH));
  }

  logAgent(
    agent,
    "info",
    `Model: ${modelChain[0]} via ${keyChain[0].label}`
  );

  let lastError: Error | null = null;

  for (const models of modelBatches) {
    for (let ki = 0; ki < keyChain.length; ki++) {
      const { key, label } = keyChain[ki];

      try {
        if (ki > 0) {
          logAgent(agent, "warn", `Rerouting key → ${label}`);
        } else if (models[0] !== modelChain[0]) {
          logAgent(agent, "warn", `Rerouting model → ${models.join(" → ")}`);
        }

        return await streamCompletion(
          key,
          models,
          systemPrompt,
          userPrompt,
          maxTokens,
          agent
        );
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;
        const httpCode = Number(msg.match(/HTTP (\d+)/)?.[1] ?? 0);
        const retryable =
          isRetryableStatus(httpCode) ||
          msg.includes("Empty response") ||
          msg.includes("LLM stream error") ||
          msg.includes("LLM error");

        logAgent(
          agent,
          "warn",
          `${label} + [${models.join(", ")}] failed`,
          msg.slice(0, 200)
        );

        const hasNextKey = ki < keyChain.length - 1;
        const hasNextBatch = modelBatches.indexOf(models) < modelBatches.length - 1;

        if (!retryable && !hasNextKey && !hasNextBatch) {
          throw lastError;
        }
        if (!hasNextKey && !hasNextBatch) {
          throw lastError;
        }
      }
    }
  }

  throw lastError ?? new Error("All models and API keys failed");
}

export function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
