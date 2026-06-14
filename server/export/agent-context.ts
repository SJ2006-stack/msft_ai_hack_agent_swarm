import type { ResearchEvidence } from "@/swarm/state";
import type { AgentOutputs } from "@/server/export/agent-outputs";
import type { AgentName } from "@/types/agents";
import type { GTMInput } from "@/types/gtm";

export type AgentInputSection = {
  title: string;
  payload: unknown;
};

export type AgentContextSources = {
  input?: GTMInput | null;
  websiteContent?: string | null;
  agentOutputs?: AgentOutputs;
  researchEvidence?: Partial<
    Record<"signal_hunter" | "prospect_discovery", ResearchEvidence | null>
  > | null;
};

const WEBSITE_EXCERPT_CHARS = 500;

function excerpt(text: string, max = WEBSITE_EXCERPT_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function pickOutput(agentOutputs: AgentOutputs | undefined, agent: AgentName): Record<string, unknown> | null {
  return asRecord(agentOutputs?.[agent]);
}

function resolveInput(ctx: AgentContextSources): GTMInput | null {
  if (ctx.input) return ctx.input;
  const processor = pickOutput(ctx.agentOutputs, "input_processor");
  const nested = processor?.input;
  if (nested && typeof nested === "object") return nested as GTMInput;
  return null;
}

function resolveWebsiteContent(ctx: AgentContextSources): string | null {
  if (ctx.websiteContent) return ctx.websiteContent;
  const processor = pickOutput(ctx.agentOutputs, "input_processor");
  const nested = processor?.website_content;
  return typeof nested === "string" && nested.trim() ? nested : null;
}

function resolveResearchEvidence(
  ctx: AgentContextSources
): Partial<Record<"signal_hunter" | "prospect_discovery", ResearchEvidence | null>> {
  if (ctx.researchEvidence) return ctx.researchEvidence;

  const signalOut = pickOutput(ctx.agentOutputs, "signal_hunter");
  const prospectOut = pickOutput(ctx.agentOutputs, "prospect_discovery");

  return {
    signal_hunter:
      (signalOut?.research_evidence as ResearchEvidence | null | undefined) ?? null,
    prospect_discovery:
      (prospectOut?.research_evidence as ResearchEvidence | null | undefined) ?? null,
  };
}

function numberedSearchResults(evidence: ResearchEvidence | null | undefined): unknown {
  if (!evidence?.results?.length) return null;
  return evidence.results.map((result, index) => ({
    id: index + 1,
    title: result.title,
    url: result.url,
    excerpt: excerpt(result.content, 240),
  }));
}

function summarizeSignals(output: Record<string, unknown> | null): unknown {
  if (!output) return null;
  const signals = output.market_signals;
  if (!Array.isArray(signals)) return null;
  return {
    signal_count: signals.length,
    intent_indicators: output.intent_indicators ?? [],
    highlights: signals.slice(0, 5).map((signal) => {
      const s = signal as Record<string, unknown>;
      return {
        signal_type: s.signal_type,
        urgency: s.urgency,
        description: s.description,
      };
    }),
  };
}

function summarizeProspects(output: Record<string, unknown> | null): unknown {
  if (!output) return null;
  const prospects = output.prospects;
  if (!Array.isArray(prospects)) return null;
  return {
    prospect_count: prospects.length,
    top_prospects: prospects.slice(0, 8).map((prospect) => {
      const p = prospect as Record<string, unknown>;
      return {
        company_name: p.company_name,
        industry: p.industry,
        fit_score: p.fit_score,
      };
    }),
  };
}

function aggregateReportInputs(agentOutputs: AgentOutputs | undefined): unknown {
  const counts = {
    icps: pickOutput(agentOutputs, "gtm_strategist")?.icps,
    primary_markets: pickOutput(agentOutputs, "market_mapper")?.primary_markets,
    market_signals: pickOutput(agentOutputs, "signal_hunter")?.market_signals,
    prospects: pickOutput(agentOutputs, "prospect_discovery")?.prospects,
    decision_makers: pickOutput(agentOutputs, "decision_maker_finder")?.decision_makers,
    ranked_opportunities: pickOutput(agentOutputs, "opportunity_scorer")?.ranked_opportunities,
    outreach_strategies: pickOutput(agentOutputs, "outreach_planner")?.outreach_strategies,
  };

  return {
    icp_count: Array.isArray(counts.icps) ? counts.icps.length : 0,
    primary_market_count: Array.isArray(counts.primary_markets)
      ? counts.primary_markets.length
      : 0,
    signal_count: Array.isArray(counts.market_signals) ? counts.market_signals.length : 0,
    prospect_count: Array.isArray(counts.prospects) ? counts.prospects.length : 0,
    decision_maker_count: Array.isArray(counts.decision_makers)
      ? counts.decision_makers.length
      : 0,
    opportunity_count: Array.isArray(counts.ranked_opportunities)
      ? counts.ranked_opportunities.length
      : 0,
    outreach_count: Array.isArray(counts.outreach_strategies)
      ? counts.outreach_strategies.length
      : 0,
    top_opportunities: Array.isArray(counts.ranked_opportunities)
      ? (counts.ranked_opportunities as unknown[]).slice(0, 3)
      : [],
    top_prospects: Array.isArray(counts.prospects)
      ? (counts.prospects as unknown[]).slice(0, 3)
      : [],
  };
}

export function getAgentInputs(
  agent: AgentName,
  ctx: AgentContextSources = {}
): AgentInputSection[] {
  const input = resolveInput(ctx);
  const websiteContent = resolveWebsiteContent(ctx);
  const researchEvidence = resolveResearchEvidence(ctx);
  const agentOutputs = ctx.agentOutputs ?? {};

  switch (agent) {
    case "input_processor":
      return [{ title: "GTM form fields", payload: input }];

    case "gtm_strategist":
      return [
        { title: "Parsed input", payload: input },
        {
          title: "Website excerpt",
          payload: websiteContent ? excerpt(websiteContent) : null,
        },
      ];

    case "market_mapper":
      return [
        {
          title: "GTM strategy",
          payload: pickOutput(agentOutputs, "gtm_strategist"),
        },
      ];

    case "signal_hunter":
      return [
        {
          title: "GTM strategy",
          payload: pickOutput(agentOutputs, "gtm_strategist"),
        },
        {
          title: "Tavily search results",
          payload: numberedSearchResults(researchEvidence.signal_hunter),
        },
      ];

    case "join_research":
      return [
        {
          title: "Market map",
          payload: pickOutput(agentOutputs, "market_mapper"),
        },
        {
          title: "Buying signals",
          payload: pickOutput(agentOutputs, "signal_hunter"),
        },
      ];

    case "prospect_discovery":
      return [
        {
          title: "ICPs",
          payload: pickOutput(agentOutputs, "gtm_strategist")?.icps ?? null,
        },
        {
          title: "Signals summary",
          payload: summarizeSignals(pickOutput(agentOutputs, "signal_hunter")),
        },
        {
          title: "Tavily search results",
          payload: numberedSearchResults(researchEvidence.prospect_discovery),
        },
      ];

    case "decision_maker_finder":
    case "opportunity_scorer":
      return [
        {
          title: "Prospects",
          payload: summarizeProspects(pickOutput(agentOutputs, "prospect_discovery")),
        },
      ];

    case "join_qualify":
      return [
        {
          title: "Decision makers",
          payload: pickOutput(agentOutputs, "decision_maker_finder"),
        },
        {
          title: "Opportunity scores",
          payload: pickOutput(agentOutputs, "opportunity_scorer"),
        },
      ];

    case "outreach_planner":
      return [
        {
          title: "Top opportunities",
          payload: pickOutput(agentOutputs, "opportunity_scorer")?.ranked_opportunities ?? null,
        },
        {
          title: "Decision makers",
          payload: pickOutput(agentOutputs, "decision_maker_finder")?.decision_makers ?? null,
        },
      ];

    case "report_assembler":
      return [
        {
          title: "Pipeline aggregates",
          payload: aggregateReportInputs(agentOutputs),
        },
      ];

    default:
      return [];
  }
}
