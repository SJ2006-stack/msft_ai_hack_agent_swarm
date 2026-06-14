import type { GTMReportState } from "@/lib/agents/state";
import {
  ProspectDiscoveryOutputSchema,
  ProspectDiscoveryParseSchema,
  MAX_PROSPECTS,
} from "@/types/gtm";
import { PROSPECT_DISCOVERY_SYSTEM } from "@/lib/agents/prompts";
import { FIXTURE_PROSPECTS } from "@/lib/fixtures/demo-slices";
import { executeLLMNode } from "@/lib/agents/llm-node";
import { searchWeb } from "@/lib/agents/tools/tavily";
import { isMockLLM } from "@/lib/agents/tools/mock";
import { logAgent, parseSchemaWithLog } from "@/lib/agents/agent-logger";
import { linkProspectCitations } from "@/lib/agents/citation-linker";

export async function runProspectDiscovery(
  state: GTMReportState
): Promise<Partial<GTMReportState>> {
  const icps = state.gtm_strategy?.icps.map((i) => i.name).join(", ") ?? "";
  const query = `companies matching ICP: ${icps} ${state.input.product}`;

  if (isMockLLM()) {
    logAgent("prospect_discovery", "info", "MOCK_LLM enabled — using fixture prospects");
    const prospects = parseSchemaWithLog(
      "prospect_discovery",
      ProspectDiscoveryOutputSchema,
      FIXTURE_PROSPECTS,
      "Fixture prospects"
    );
    return {
      prospects: { prospects: prospects.prospects.slice(0, MAX_PROSPECTS) },
    };
  }

  if (!icps) {
    logAgent(
      "prospect_discovery",
      "warn",
      "No ICPs in state — prospect search may return poor results"
    );
  }

  logAgent("prospect_discovery", "step", `Searching prospects via Tavily: "${query}"`);
  const searchResults = await searchWeb(query, MAX_PROSPECTS, "prospect_discovery");

  return executeLLMNode({
    agent: "prospect_discovery",
    state,
    schema: ProspectDiscoveryOutputSchema,
    parseSchema: ProspectDiscoveryParseSchema,
    systemPrompt: PROSPECT_DISCOVERY_SYSTEM,
    buildPrompt: (s) => ({
      company: s.input.company,
      product: s.input.product,
      gtm_strategy: s.gtm_strategy,
      market_map: s.market_map,
      signals: s.signals,
      search_results: searchResults.map((result, index) => ({
        source_id: index + 1,
        title: result.title,
        url: result.url,
        content: result.content,
      })),
      max_prospects: MAX_PROSPECTS,
    }),
    transformParsed: (draft) =>
      linkProspectCitations(draft, searchResults, "prospect_discovery"),
    mapResult: (parsed) => ({
      research_evidence: {
        ...state.research_evidence,
        prospect_discovery: { query, results: searchResults },
      },
      prospects: { prospects: parsed.prospects.slice(0, MAX_PROSPECTS) },
    }),
    fixture: FIXTURE_PROSPECTS,
  });
}
