import { z } from "zod";
import type { GTMReportState } from "@/swarm/state";
import { GTMReportSchema } from "@/types/gtm";
import { getLangSmithTraceUrl } from "@/server/llm/tracing";
import { REPORT_ASSEMBLER_SYSTEM } from "./prompt";
import { buildFixtureReport } from "@/fixtures/demo-slices";
import { executeLLMNode } from "@/swarm/shared/llm-node";
import { logAgent, parseSchemaWithLog } from "@/swarm/shared/agent-logger";

const ReportSummarySchema = z.object({
  summary: z.string(),
});

export async function runReportAssembler(
  state: GTMReportState
): Promise<Partial<GTMReportState>> {
  logAgent("report_assembler", "step", "Assembling final GTM report from agent outputs");
  const baseReport = buildFixtureReport(state);

  let executiveSummary = baseReport.summary;
  await executeLLMNode({
    agent: "report_assembler",
    state,
    schema: ReportSummarySchema,
    systemPrompt: REPORT_ASSEMBLER_SYSTEM,
    buildPrompt: (s) => ({
      icp_count: s.gtm_strategy?.icps.length,
      prospect_count: s.prospects?.prospects.length,
      top_opportunity: s.opportunities?.ranked_opportunities[0],
    }),
    mapResult: (parsed) => {
      executiveSummary = parsed.summary;
      return {};
    },
    fixture: { summary: baseReport.summary },
    fixtureLabel: "Report summary",
  });

  if (!executiveSummary?.trim()) {
    logAgent("report_assembler", "warn", "LLM returned empty summary — using default text");
    executiveSummary = baseReport.summary;
  }

  const report = parseSchemaWithLog(
    "report_assembler",
    GTMReportSchema,
    {
      ...baseReport,
      summary: executiveSummary,
    },
    "Final report"
  );

  logAgent("report_assembler", "info", "Final report validated and ready");
  return {
    report,
    langsmith_trace_url: getLangSmithTraceUrl(state.run_id),
  };
}
