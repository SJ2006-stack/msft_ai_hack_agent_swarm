#!/usr/bin/env tsx
/**
 * Isolated node test: npx tsx scripts/dev/test-node.ts --agent gtm_strategist
 */
import { createInitialState } from "../../swarm/state";
import { FIXTURE_INPUT } from "../../fixtures/demo-input";
import type { AgentName } from "../../types/agents";
import { runInputProcessor } from "../../swarm/agents/input-processor/node";
import { runGTMStrategist } from "../../swarm/agents/gtm-strategist/node";
import { runMarketMapper } from "../../swarm/agents/market-mapper/node";
import { runSignalHunter } from "../../swarm/agents/signal-hunter/node";
import { runProspectDiscovery } from "../../swarm/agents/prospect-discovery/node";
import { runDecisionMakerFinder } from "../../swarm/agents/decision-maker-finder/node";
import { runOpportunityScorer } from "../../swarm/agents/opportunity-scorer/node";
import { runOutreachPlanner } from "../../swarm/agents/outreach-planner/node";
import { runReportAssembler } from "../../swarm/agents/report-assembler/node";
import {
  FIXTURE_GTM_STRATEGY,
  FIXTURE_MARKET_MAP,
  FIXTURE_SIGNALS,
  FIXTURE_PROSPECTS,
  FIXTURE_DECISION_MAKERS,
  FIXTURE_OPPORTUNITIES,
  FIXTURE_OUTREACH,
} from "../../fixtures/demo-slices";

const NODE_RUNNERS: Partial<
  Record<AgentName, (state: ReturnType<typeof createInitialState>) => Promise<unknown>>
> = {
  input_processor: runInputProcessor,
  gtm_strategist: runGTMStrategist,
  market_mapper: runMarketMapper,
  signal_hunter: runSignalHunter,
  prospect_discovery: runProspectDiscovery,
  decision_maker_finder: runDecisionMakerFinder,
  opportunity_scorer: runOpportunityScorer,
  outreach_planner: runOutreachPlanner,
  report_assembler: runReportAssembler,
};

function buildStateForAgent(agent: AgentName) {
  const state = createInitialState(`test-${agent}`, FIXTURE_INPUT);
  state.gtm_strategy = FIXTURE_GTM_STRATEGY;
  state.market_map = FIXTURE_MARKET_MAP;
  state.signals = FIXTURE_SIGNALS;
  state.prospects = FIXTURE_PROSPECTS;
  state.decision_makers = FIXTURE_DECISION_MAKERS;
  state.opportunities = FIXTURE_OPPORTUNITIES;
  state.outreach = FIXTURE_OUTREACH;
  return state;
}

async function main() {
  process.env.MOCK_LLM = "true";
  const agentArg = process.argv.find((a) => a.startsWith("--agent="))?.split("=")[1]
    ?? process.argv[process.argv.indexOf("--agent") + 1];

  if (!agentArg || !(agentArg in NODE_RUNNERS)) {
    console.error("Usage: test-node.ts --agent <agent_name>");
    console.error("Available:", Object.keys(NODE_RUNNERS).join(", "));
    process.exit(1);
  }

  const agent = agentArg as AgentName;
  const runner = NODE_RUNNERS[agent]!;
  const state = buildStateForAgent(agent);

  console.log(`Testing node: ${agent}`);
  const result = await runner(state);
  console.log(JSON.stringify(result, null, 2));
  console.log(`✅ ${agent} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
