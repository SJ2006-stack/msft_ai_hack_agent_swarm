import type { GTMReportState } from "@/swarm/state";
import {
  SignalHunterOutputSchema,
  SignalHunterParseSchema,
  MAX_SIGNALS,
} from "@/types/gtm";
import { SIGNAL_HUNTER_SYSTEM } from "./prompt";
import { FIXTURE_SIGNALS } from "@/fixtures/demo-slices";
import { executeLLMNode } from "@/swarm/shared/llm-node";
import { searchWeb } from "@/swarm/tools/tavily";
import { isMockLLM } from "@/swarm/tools/mock";
import { logAgent, parseSchemaWithLog } from "@/swarm/shared/agent-logger";
import { linkBuyingSignalCitations } from "@/swarm/shared/citation-linker";

export async function runSignalHunter(
  state: GTMReportState
): Promise<Partial<GTMReportState>> {
  const query = `${state.input.company} ${state.input.product} buying signals funding hiring`;

  if (isMockLLM()) {
    logAgent("signal_hunter", "info", "MOCK_LLM enabled — using fixture signals");
    const signals = parseSchemaWithLog(
      "signal_hunter",
      SignalHunterOutputSchema,
      FIXTURE_SIGNALS,
      "Fixture signals"
    );
    return {
      signals: {
        ...signals,
        market_signals: signals.market_signals.slice(0, MAX_SIGNALS),
      },
    };
  }

  logAgent("signal_hunter", "step", `Searching web via Tavily: "${query}"`);
  const searchResults = await searchWeb(query, MAX_SIGNALS, "signal_hunter");

  return executeLLMNode({
    agent: "signal_hunter",
    state,
    schema: SignalHunterOutputSchema,
    parseSchema: SignalHunterParseSchema,
    systemPrompt: SIGNAL_HUNTER_SYSTEM,
    buildPrompt: (s) => ({
      company: s.input.company,
      product: s.input.product,
      gtm_strategy: s.gtm_strategy,
      search_results: searchResults.map((result, index) => ({
        source_id: index + 1,
        title: result.title,
        url: result.url,
        content: result.content,
      })),
      max_signals: MAX_SIGNALS,
    }),
    transformParsed: (draft) =>
      linkBuyingSignalCitations(draft, searchResults, "signal_hunter"),
    mapResult: (parsed) => ({
      research_evidence: {
        ...state.research_evidence,
        signal_hunter: { query, results: searchResults },
      },
      signals: {
        ...parsed,
        market_signals: parsed.market_signals.slice(0, MAX_SIGNALS),
      },
    }),
    fixture: FIXTURE_SIGNALS,
  });
}
