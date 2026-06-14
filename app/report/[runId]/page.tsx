"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  Zap,
  Layers,
  Terminal,
  Search,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { AgentFlowGraph } from "@/components/swarm/agent-flow-graph-dynamic";
import { AgentActivityLog } from "@/components/swarm/agent-activity-log";
import { AgentOutputExplorer } from "@/components/swarm/agent-output-explorer";
import { PipelineInspector } from "@/components/swarm/pipeline-inspector";
import { InputSummary } from "@/components/report/input-summary";
import { ICPReportSection } from "@/components/report/icp";
import { MarketsReportSection } from "@/components/report/markets";
import { SignalsReportSection } from "@/components/report/signals";
import { ProspectsReportSection } from "@/components/report/prospects";
import { OutreachReportSection } from "@/components/report/outreach";
import { useReportStream } from "@/hooks/use-report-stream";
import { springSnappy } from "@/lib/motion-presets";

export default function ReportPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const searchParams = useSearchParams();
  const demoHint = useMemo(
    () => searchParams.get("demo") === "1",
    [searchParams]
  );
  const {
    agentStatuses,
    agentOutputs,
    timeline,
    report,
    input,
    websiteContent,
    researchEvidence,
    isComplete,
    error,
    langsmithTraceUrl,
    demoMode,
    selectedAgent,
    setSelectedAgent,
  } = useReportStream(runId, { demoHint });

  const doneCount = Object.values(agentStatuses).filter((s) => s === "done").length;

  const generatedAt = report?.generated_at
    ? new Date(report.generated_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#FCD116] flex flex-col md:flex-row relative">
      <aside className="fixed bottom-0 left-0 w-full h-16 md:h-screen md:w-14 bg-[#0A0A0A] border-t-4 md:border-t-0 md:border-r-4 border-black flex flex-row md:flex-col justify-between items-center py-2 md:py-6 px-4 md:px-0 z-50">
        <div className="hidden md:flex flex-col items-center gap-1.5">
          <Link
            href="/"
            className="w-8 h-8 bg-[#FCD116] text-[#0A0A0A] flex items-center justify-center font-black text-base border-2 border-black tracking-tighter shadow-sm"
          >
            GM
          </Link>
          <span className="text-[9px] font-bold tracking-widest text-[#FCD116] rotate-90 my-3">
            GTMAXXIN
          </span>
        </div>

        <div className="flex flex-row md:flex-col gap-4 md:gap-6 items-center w-full justify-around md:justify-center">
          <Link
            href="/"
            aria-label="Home"
            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-black bg-transparent text-[#FCD116] hover:bg-[#FCD116]/20 transition-all"
          >
            <Menu className="w-4 h-4 stroke-[3]" />
          </Link>
          <Link
            href="/#launch-form"
            aria-label="New run"
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Zap className="w-5 h-5 stroke-[2]" />
          </Link>
          <Link
            href="/#architecture-section"
            aria-label="Agent graph"
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Layers className="w-5 h-5 stroke-[2]" />
          </Link>
          <a
            href="#activity-log"
            aria-label="Activity log"
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Terminal className="w-5 h-5 stroke-[2]" />
          </a>
          <Link
            href="/"
            aria-label="Search"
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </Link>
        </div>

        <div className="hidden md:flex flex-col items-center gap-4 text-xs font-semibold text-neutral-500">
          <span className="hover:text-white transition-colors">V1</span>
          <div className="w-4 h-[2px] bg-neutral-800" />
          <span className="text-[#FCD116]">DEV</span>
        </div>
      </aside>

      <main className="flex-grow md:pl-14 pb-16 md:pb-0 flex flex-col min-w-0 bg-[#FCD116] text-[#0A0A0A] p-6 md:p-12 space-y-8 min-h-screen">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-black pb-6">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-[#0A0A0A] text-[#FCD116] px-3 py-1.5 border-2 border-black text-xs font-semibold brutalist-shadow hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              Back home
            </Link>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-black">
                Workbench
              </h1>
              {demoMode !== null && (
                <span
                  className={`px-2 py-0.5 border-2 border-black text-xs font-semibold ${
                    demoMode ? "bg-[#0A0A0A] text-[#FCD116]" : "bg-white text-black"
                  }`}
                >
                  {demoMode ? "Demo" : "Live"}
                </span>
              )}
              {!isComplete && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springSnappy}
                  className="px-2 py-0.5 border-2 border-black text-xs font-semibold bg-green-600 text-white flex items-center gap-1.5"
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                  Running
                </motion.span>
              )}
            </div>

            <p className="text-sm text-neutral-800">
              <span className="font-mono">{runId}</span>
              {" · "}
              {doneCount}/11 agents done
              {generatedAt && ` · Finished ${generatedAt}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {langsmithTraceUrl && (
              <a
                href={langsmithTraceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black px-3 py-2 border-2 border-black text-xs font-semibold brutalist-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center gap-1"
              >
                LangSmith <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {report && (
              <a
                href={`/api/report/${runId}/export`}
                download="folder.zip"
                className="bg-[#0A0A0A] text-[#FCD116] px-4 py-2 border-2 border-black text-xs font-semibold brutalist-shadow brutalist-btn-hover-yellow"
              >
                Download folder.zip
              </a>
            )}
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springSnappy}
              className="p-4 bg-red-100 border-4 border-red-600 text-red-700 font-medium brutalist-shadow"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {input && <InputSummary input={input} websiteContent={websiteContent} />}

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-black border-b-2 border-black pb-1 inline-block">
            Live run
          </h2>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <section className="bg-white border-4 border-black p-4 brutalist-shadow">
              <h3 className="text-sm font-semibold mb-3 text-black border-b-2 border-black pb-1">
                Agent graph
              </h3>
              <AgentFlowGraph
                agentStatuses={agentStatuses}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </section>
            <div id="activity-log">
              <AgentActivityLog
                timeline={timeline}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </div>
          </div>
        </div>

        <PipelineInspector
          agentStatuses={agentStatuses}
          agentOutputs={agentOutputs}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          input={input}
          websiteContent={websiteContent}
          researchEvidence={researchEvidence}
        />

        <AgentOutputExplorer
          agentStatuses={agentStatuses}
          agentOutputs={agentOutputs}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />

        <AnimatePresence>
          {report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ ...springSnappy, delay: 0.05 }}
              className="space-y-4 pt-4 border-t-4 border-black"
            >
            <h2 className="text-2xl font-bold text-black">Report</h2>
            <div className="brutalist-report space-y-10">
              <section className="bg-white border-4 border-black brutalist-shadow p-6">
                <h3 className="text-xl font-bold text-black border-b-2 border-black pb-2">
                  Executive summary
                </h3>
                <p className="text-black mt-4 leading-relaxed text-sm">{report.summary}</p>
              </section>

              <ICPReportSection
                icps={report.icps}
                personas={report.personas}
                targetIndustries={report.target_industries}
                valueProposition={report.value_proposition}
              />

              <MarketsReportSection
                primaryMarkets={report.primary_markets}
                secondaryMarkets={report.secondary_markets}
                adjacentMarkets={report.adjacent_markets}
              />

              <SignalsReportSection
                signals={report.market_signals}
                intentIndicators={report.intent_indicators}
                onJumpToAgent={setSelectedAgent}
              />

              <ProspectsReportSection
                prospects={report.prospects}
                opportunities={report.ranked_opportunities}
                decisionMakers={report.decision_makers}
                outreachStrategies={report.outreach_strategies}
                onJumpToAgent={setSelectedAgent}
              />

              <OutreachReportSection strategies={report.outreach_strategies} />
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!report && !error && timeline.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white border-4 border-black brutalist-shadow"
          >
            <motion.p
              animate={{ opacity: [0.45, 0.9, 0.45] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-neutral-600"
            >
              Connecting to stream…
            </motion.p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
