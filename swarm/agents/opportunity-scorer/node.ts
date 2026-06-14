import type { GTMReportState } from "@/swarm/state";
import { OpportunityScorerOutputSchema } from "@/types/gtm";
import { OPPORTUNITY_SCORER_SYSTEM } from "./prompt";
import { FIXTURE_OPPORTUNITIES } from "@/fixtures/demo-slices";
import { executeLLMNode } from "@/swarm/shared/llm-node";
import { logAgent } from "@/swarm/shared/agent-logger";

export async function runOpportunityScorer(
  state: GTMReportState
): Promise<Partial<GTMReportState>> {
  if (!state.prospects?.prospects.length) {
    logAgent("opportunity_scorer", "warn", "No prospects to score");
  }

  return executeLLMNode({
    agent: "opportunity_scorer",
    state,
    schema: OpportunityScorerOutputSchema,
    systemPrompt: OPPORTUNITY_SCORER_SYSTEM,
    buildPrompt: (s) => ({
      prospects: s.prospects?.prospects,
      signals: s.signals,
      gtm_strategy: s.gtm_strategy,
    }),
    mapResult: (parsed) => ({ opportunities: parsed }),
    fixture: FIXTURE_OPPORTUNITIES,
  });
}
