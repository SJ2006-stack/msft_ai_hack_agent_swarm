import type { z } from "zod";
import type { AgentName } from "@/types/agents";
import type { GTMReportState } from "@/lib/agents/state";
import {
  formatError,
  logAgent,
  parseJsonWithLog,
  parseSchemaWithLog,
  truncate,
} from "@/lib/agents/agent-logger";
import { callLLM } from "@/lib/llm/openrouter";
import { isMockLLM } from "@/lib/agents/tools/mock";

const MAX_LLM_ATTEMPTS = 3;

type LLMNodeOptions<TParsed, TOutput = TParsed> = {
  agent: AgentName;
  state: GTMReportState;
  schema: z.ZodType<TOutput>;
  parseSchema?: z.ZodType<TParsed>;
  systemPrompt: string;
  buildPrompt: (state: GTMReportState) => Record<string, unknown>;
  transformParsed?: (parsed: TParsed) => TOutput;
  mapResult: (parsed: TOutput) => Partial<GTMReportState>;
  fixture: TOutput;
  fixtureLabel?: string;
};

function buildRepairMessage(
  promptPayload: Record<string, unknown>,
  raw: string,
  validationErrors: string
): string {
  return JSON.stringify({
    ...promptPayload,
    repair: {
      previous_output: truncate(raw, 400),
      validation_errors: validationErrors,
    },
  });
}

export async function executeLLMNode<TParsed, TOutput = TParsed>(
  options: LLMNodeOptions<TParsed, TOutput>
): Promise<Partial<GTMReportState>> {
  const {
    agent,
    state,
    schema,
    parseSchema,
    systemPrompt,
    buildPrompt,
    transformParsed,
    mapResult,
    fixture,
    fixtureLabel = "Fixture",
  } = options;

  const inputSchema = parseSchema ?? (schema as unknown as z.ZodType<TParsed>);

  if (isMockLLM()) {
    logAgent(agent, "info", "MOCK_LLM enabled — loading fixture data");
    const parsed = parseSchemaWithLog(agent, schema, fixture, fixtureLabel);
    return mapResult(parsed);
  }

  logAgent(agent, "step", "Calling OpenRouter LLM");
  const promptPayload = buildPrompt(state);
  logAgent(agent, "info", "Prepared LLM input", truncate(JSON.stringify(promptPayload)));

  let userMessage = JSON.stringify(promptPayload);

  for (let attempt = 0; attempt < MAX_LLM_ATTEMPTS; attempt++) {
    const raw = await callLLM(systemPrompt, userMessage, { agent });
    logAgent(agent, "info", `LLM response received (${raw.length} chars)`);

    let json: unknown;
    try {
      json = parseJsonWithLog<unknown>(agent, raw);
    } catch (err) {
      if (attempt < MAX_LLM_ATTEMPTS - 1) {
        const validationErrors =
          err instanceof Error ? err.message : String(err);
        logAgent(
          agent,
          "warn",
          "JSON parse failed — retrying with repair prompt",
          validationErrors
        );
        userMessage = buildRepairMessage(promptPayload, raw, validationErrors);
        continue;
      }
      throw err;
    }

    const draftResult = inputSchema.safeParse(json);
    if (!draftResult.success) {
      if (attempt < MAX_LLM_ATTEMPTS - 1) {
        const validationErrors = formatError(draftResult.error);
        logAgent(
          agent,
          "warn",
          "Schema validation failed — retrying with repair prompt",
          validationErrors
        );
        userMessage = buildRepairMessage(promptPayload, raw, validationErrors);
        continue;
      }
      const draft = parseSchemaWithLog(agent, inputSchema, json, "LLM output");
      const linked = transformParsed
        ? transformParsed(draft)
        : (draft as unknown as TOutput);
      const parsed = parseSchemaWithLog(agent, schema, linked, "Linked output");
      return mapResult(parsed);
    }

    const linked = transformParsed
      ? transformParsed(draftResult.data)
      : (draftResult.data as unknown as TOutput);
    const result = schema.safeParse(linked);
    if (!result.success) {
      if (attempt < MAX_LLM_ATTEMPTS - 1) {
        const validationErrors = formatError(result.error);
        logAgent(
          agent,
          "warn",
          "Linked output validation failed — retrying with repair prompt",
          validationErrors
        );
        userMessage = buildRepairMessage(promptPayload, raw, validationErrors);
        continue;
      }
      const parsed = parseSchemaWithLog(agent, schema, linked, "Linked output");
      return mapResult(parsed);
    }

    logAgent(agent, "info", "LLM output passed schema validation");
    return mapResult(result.data);
  }

  throw new Error(`${agent}: exhausted LLM retry attempts`);
}
