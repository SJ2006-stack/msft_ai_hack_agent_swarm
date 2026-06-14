import type { AgentName } from "@/types/agents";
import { AGENT_LABELS } from "@/types/agents";
import type { GTMReportState } from "@/swarm/state";
import { createInitialState } from "@/swarm/state";
import type { AgentLogEvent, AgentStatusEvent } from "@/swarm/events";
import { createAgentStatusEvent } from "@/swarm/events";
import {
  extractAgentOutput,
  summarizeAgentOutput,
} from "@/server/export/agent-outputs";
import type { SwarmEmitter } from "@/swarm/orchestrator";
import {
  buildDemoReport,
  type DemoCompany,
} from "@/fixtures/demo-companies";
import { DEMO_REPLAY_LINE_DELAY_MS, demoReplayDelay } from "@/lib/demo-replay-pacing";

const PHASES: AgentName[][] = [
  ["input_processor"],
  ["gtm_strategist"],
  ["market_mapper", "signal_hunter"],
  ["join_research"],
  ["prospect_discovery"],
  ["decision_maker_finder", "opportunity_scorer"],
  ["join_qualify"],
  ["outreach_planner"],
  ["report_assembler"],
];

const DEFAULT_EVENT_DELAY_MS = DEMO_REPLAY_LINE_DELAY_MS;

function delay(ms: number): Promise<void> {
  return ms > 0 ? demoReplayDelay(ms) : Promise.resolve();
}

type PacedLog = (
  agent: AgentName,
  level: AgentLogEvent["level"],
  message: string
) => Promise<void>;

function createLogEvent(
  runId: string,
  agent: AgentName,
  level: AgentLogEvent["level"],
  message: string
): AgentLogEvent {
  return {
    run_id: runId,
    agent,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

async function applyAgentSlice(
  agent: AgentName,
  state: GTMReportState,
  c: DemoCompany,
  log: PacedLog
): Promise<void> {
  switch (agent) {
    case "input_processor":
      state.website_content = c.website_content;
      await log(
        "input_processor",
        "info",
        `Website content captured (${c.website_content.length} chars)`
      );
      break;
    case "gtm_strategist":
      state.gtm_strategy = c.gtm_strategy;
      break;
    case "market_mapper":
      state.market_map = c.market_map;
      break;
    case "signal_hunter":
      await log(
        "signal_hunter",
        "step",
        `Searching web via Tavily: "${c.signal_evidence.query}"`
      );
      await log(
        "signal_hunter",
        "info",
        `Tavily returned ${c.signal_evidence.results.length} result(s)`
      );
      state.signals = c.signals;
      state.research_evidence = {
        ...state.research_evidence,
        signal_hunter: c.signal_evidence,
      };
      break;
    case "join_research":
      break;
    case "prospect_discovery":
      await log(
        "prospect_discovery",
        "step",
        `Searching web via Tavily: "${c.prospect_evidence.query}"`
      );
      await log(
        "prospect_discovery",
        "info",
        `Tavily returned ${c.prospect_evidence.results.length} result(s)`
      );
      state.prospects = c.prospects;
      state.research_evidence = {
        ...state.research_evidence,
        prospect_discovery: c.prospect_evidence,
      };
      break;
    case "decision_maker_finder":
      state.decision_makers = c.decision_makers;
      break;
    case "opportunity_scorer":
      state.opportunities = c.opportunities;
      break;
    case "join_qualify":
      break;
    case "outreach_planner":
      state.outreach = c.outreach;
      break;
    case "report_assembler":
      state.report = buildDemoReport(c);
      break;
  }
  state.agent_statuses[agent] = "done";
}

export async function runDemoReplay(
  runId: string,
  company: DemoCompany,
  emit?: SwarmEmitter | ((event: Parameters<NonNullable<SwarmEmitter>>[0]) => Promise<void>),
  options?: { eventDelayMs?: number; stepMs?: number }
): Promise<GTMReportState> {
  const eventDelayMs =
    options?.eventDelayMs ?? options?.stepMs ?? DEFAULT_EVENT_DELAY_MS;
  const state = createInitialState(runId, company.input);

  async function pacedLog(
    agent: AgentName,
    level: AgentLogEvent["level"],
    message: string
  ): Promise<void> {
    await emit?.({ type: "log", data: createLogEvent(runId, agent, level, message) });
    if (eventDelayMs > 0) await delay(eventDelayMs);
  }

  async function pacedStatus(data: AgentStatusEvent): Promise<void> {
    await emit?.({ type: "status", data });
    if (eventDelayMs > 0) await delay(eventDelayMs);
  }

  await pacedLog(
    "input_processor",
    "info",
    `Demo dataset loaded for ${company.label}`
  );

  for (const group of PHASES) {
    for (const agent of group) {
      await pacedLog(agent, "step", `Starting ${AGENT_LABELS[agent]}`);
      await pacedStatus(createAgentStatusEvent(runId, agent, "running"));
    }

    for (const agent of group) {
      await applyAgentSlice(agent, state, company, pacedLog);
      const output = extractAgentOutput(agent, state);
      const summary = summarizeAgentOutput(agent, output);
      await pacedLog(agent, "info", summary);
      await pacedStatus({
        ...createAgentStatusEvent(runId, agent, "done"),
        output,
        summary,
      });
    }
  }

  return state;
}
