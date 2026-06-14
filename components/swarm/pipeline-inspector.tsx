"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { CitationChip } from "@/components/report/citation-chip";
import { getAgentInputs } from "@/lib/export/agent-context";
import type { ResearchEvidence } from "@/lib/agents/state";
import type { AgentOutputs } from "@/lib/export/agent-outputs";
import {
  AGENT_LABELS,
  AGENT_NAMES,
  type AgentName,
  type AgentStatuses,
} from "@/types/agents";
import type { Citation, GTMInput } from "@/types/gtm";
import { cn } from "@/lib/utils";

type TabId = "inputs" | "outputs" | "sources";

type Props = {
  agentStatuses: AgentStatuses;
  agentOutputs: AgentOutputs;
  selectedAgent: AgentName | null;
  onSelectAgent: (agent: AgentName) => void;
  input?: GTMInput | null;
  websiteContent?: string | null;
  researchEvidence?: Partial<
    Record<"signal_hunter" | "prospect_discovery", ResearchEvidence | null>
  > | null;
};

const statusBadge: Record<string, string> = {
  pending: "bg-neutral-200 text-neutral-700",
  running: "bg-[#FCD116] text-black animate-pulse",
  done: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
};

function OutputPreview({ agent, output }: { agent: AgentName; output: unknown }) {
  if (!output || typeof output !== "object") {
    return <p className="text-sm font-medium text-neutral-600">No output data.</p>;
  }

  const data = output as Record<string, unknown>;

  if (agent === "gtm_strategist" && Array.isArray(data.icps)) {
    return (
      <ul className="space-y-2">
        {(data.icps as Array<{ name: string; description: string }>).map((icp) => (
          <li key={icp.name} className="text-sm border-l-4 border-black pl-3">
            <p className="font-black uppercase text-black">{icp.name}</p>
            <p className="font-medium text-neutral-800">{icp.description}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "prospect_discovery" && Array.isArray(data.prospects)) {
    return (
      <ul className="space-y-3">
        {(
          data.prospects as Array<{
            company_name: string;
            fit_score: number;
            industry: string;
            citations?: Citation[];
          }>
        ).map((p) => (
          <li key={p.company_name} className="space-y-2 border-b-2 border-black pb-3">
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-black text-black">{p.company_name}</span>
              <span className="font-bold text-neutral-700 shrink-0">
                {p.industry} · {p.fit_score}% fit
              </span>
            </div>
            {p.citations && p.citations.length > 0 && (
              <CitationChip citations={p.citations} />
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "signal_hunter" && Array.isArray(data.market_signals)) {
    return (
      <ul className="space-y-3">
        {(
          data.market_signals as Array<{
            signal_type: string;
            urgency: string;
            description: string;
            citations?: Citation[];
          }>
        ).map((s, i) => (
          <li key={i} className="space-y-2 text-sm">
            <div>
              <span
                className={cn(
                  "inline-block px-1.5 py-0.5 text-xs mr-2 border-2 border-black font-black uppercase",
                  s.urgency === "high"
                    ? "bg-red-500 text-white"
                    : s.urgency === "medium"
                      ? "bg-[#FCD116] text-black"
                      : "bg-white text-black"
                )}
              >
                {s.urgency}
              </span>
              <span className="font-black text-black">{s.signal_type}</span>
              <p className="font-medium text-neutral-800 mt-0.5">{s.description}</p>
            </div>
            {s.citations && s.citations.length > 0 && (
              <CitationChip citations={s.citations} />
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "outreach_planner" && Array.isArray(data.outreach_strategies)) {
    return (
      <ul className="space-y-3">
        {(data.outreach_strategies as Array<{ company_name: string; outreach_angle: string }>).map(
          (s) => (
            <li key={s.company_name} className="text-sm border-l-4 border-black pl-3">
              <p className="font-black text-black">{s.company_name}</p>
              <p className="font-medium text-neutral-800">{s.outreach_angle}</p>
            </li>
          )
        )}
      </ul>
    );
  }

  if (agent === "report_assembler" && typeof data.summary === "string") {
    return <p className="text-sm font-medium text-black leading-relaxed">{data.summary}</p>;
  }

  return (
    <pre className="text-xs bg-[#0A0A0A] border-4 border-black p-3 overflow-x-auto text-green-300 font-mono">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

function JsonBlock({ data, showRaw }: { data: unknown; showRaw: boolean }) {
  if (data === null || data === undefined) {
    return (
      <p className="text-sm font-medium text-neutral-600 italic">Not available yet.</p>
    );
  }

  if (showRaw) {
    return (
      <pre className="text-xs bg-[#0A0A0A] border-4 border-black p-3 overflow-x-auto text-green-300 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  if (typeof data === "string") {
    return <p className="text-sm font-medium text-black whitespace-pre-wrap">{data}</p>;
  }

  return (
    <pre className="text-xs bg-[#0A0A0A] border-4 border-black p-3 overflow-x-auto text-green-300 font-mono max-h-64 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function SourcesPanel({
  agent,
  agentOutputs,
  researchEvidence,
}: {
  agent: AgentName;
  agentOutputs: AgentOutputs;
  researchEvidence: Partial<
    Record<"signal_hunter" | "prospect_discovery", ResearchEvidence | null>
  >;
}) {
  const output = agentOutputs[agent];
  const outputRecord =
    output && typeof output === "object" ? (output as Record<string, unknown>) : null;

  const evidenceKey =
    agent === "signal_hunter"
      ? "signal_hunter"
      : agent === "prospect_discovery"
        ? "prospect_discovery"
        : null;

  const evidence = evidenceKey ? researchEvidence[evidenceKey] : null;

  const outputCitations = useMemo(() => {
    if (!outputRecord) return [] as Citation[];
    const collected: Citation[] = [];

    const pushFromArray = (items: unknown) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        const row = item as Record<string, unknown>;
        if (Array.isArray(row.citations)) {
          collected.push(...(row.citations as Citation[]));
        }
      }
    };

    pushFromArray(outputRecord.market_signals);
    pushFromArray(outputRecord.prospects);

    return collected;
  }, [outputRecord]);

  const hasEvidence = Boolean(evidence?.results?.length);
  const hasCitations = outputCitations.length > 0;

  if (!hasEvidence && !hasCitations) {
    return (
      <p className="text-sm font-medium text-neutral-600 italic">
        {agent === "signal_hunter" || agent === "prospect_discovery"
          ? "Research sources will appear when this agent completes."
          : "No external sources for this agent."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {hasEvidence && evidence && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
            Tavily · {evidence.query}
          </p>
          <ol className="space-y-2 list-decimal list-inside">
            {evidence.results.map((result, index) => (
              <li
                key={`${result.url}-${index}`}
                className="border-2 border-black p-2 bg-[#FCD116]/20 text-sm"
              >
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-black hover:underline"
                >
                  {result.title}
                </a>
                <p className="font-medium text-neutral-800 mt-1 line-clamp-2">
                  {result.content}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasCitations && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
            Linked citations
          </p>
          <CitationChip citations={outputCitations} />
        </div>
      )}
    </div>
  );
}

export function PipelineInspector({
  agentStatuses,
  agentOutputs,
  selectedAgent,
  onSelectAgent,
  input,
  websiteContent,
  researchEvidence,
}: Props) {
  const [tab, setTab] = useState<TabId>("outputs");
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const active =
    selectedAgent ?? AGENT_NAMES.find((a) => agentOutputs[a]) ?? AGENT_NAMES[0];
  const activeIndex = AGENT_NAMES.indexOf(active);
  const output = agentOutputs[active];
  const status = agentStatuses[active];

  const contextSources = useMemo(
    () => ({
      input,
      websiteContent,
      agentOutputs,
      researchEvidence,
    }),
    [input, websiteContent, agentOutputs, researchEvidence]
  );

  const inputSections = useMemo(
    () => getAgentInputs(active, contextSources),
    [active, contextSources]
  );

  const resolvedResearchEvidence = useMemo(() => {
    if (researchEvidence) return researchEvidence;
    const signalOut = agentOutputs.signal_hunter;
    const prospectOut = agentOutputs.prospect_discovery;
    return {
      signal_hunter:
        signalOut && typeof signalOut === "object"
          ? ((signalOut as Record<string, unknown>).research_evidence as
              | ResearchEvidence
              | null
              | undefined) ?? null
          : null,
      prospect_discovery:
        prospectOut && typeof prospectOut === "object"
          ? ((prospectOut as Record<string, unknown>).research_evidence as
              | ResearchEvidence
              | null
              | undefined) ?? null
          : null,
    };
  }, [researchEvidence, agentOutputs]);

  const copyPayload = useMemo(() => {
    if (tab === "inputs") return inputSections;
    if (tab === "sources") {
      const key =
        active === "signal_hunter"
          ? "signal_hunter"
          : active === "prospect_discovery"
            ? "prospect_discovery"
            : null;
      return key ? resolvedResearchEvidence[key] : output;
    }
    return output;
  }, [tab, inputSections, active, resolvedResearchEvidence, output]);

  const handleCopy = useCallback(async () => {
    if (copyPayload === undefined) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(copyPayload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [copyPayload]);

  const stepAgent = (direction: -1 | 1) => {
    const nextIndex = activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= AGENT_NAMES.length) return;
    onSelectAgent(AGENT_NAMES[nextIndex]!);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "inputs", label: "Inputs" },
    { id: "outputs", label: "Outputs" },
    { id: "sources", label: "Sources" },
  ];

  return (
    <section className="bg-white border-4 border-black brutalist-shadow overflow-hidden">
      <div className="px-4 py-3 border-b-4 border-black flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-black uppercase tracking-tight text-black">
            Pipeline Inspector
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-700 mt-0.5">
            Input → agent → output for each step
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => stepAgent(-1)}
            disabled={activeIndex <= 0}
            className="inline-flex items-center gap-1 px-2 py-1.5 border-2 border-black bg-white font-black uppercase text-[10px] disabled:opacity-40 brutalist-shadow hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
            Prev
          </button>
          <button
            type="button"
            onClick={() => stepAgent(1)}
            disabled={activeIndex >= AGENT_NAMES.length - 1}
            className="inline-flex items-center gap-1 px-2 py-1.5 border-2 border-black bg-white font-black uppercase text-[10px] disabled:opacity-40 brutalist-shadow hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b-2 border-black bg-[#FCD116]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-black uppercase text-black truncate">{AGENT_LABELS[active]}</h3>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 border-2 border-black font-black uppercase shrink-0",
              statusBadge[status]
            )}
          >
            {status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 border-2 border-black font-black uppercase text-[10px] brutalist-shadow transition-transform",
                tab === id
                  ? "bg-[#0A0A0A] text-[#FCD116]"
                  : "bg-white text-black hover:translate-x-[-1px] hover:translate-y-[-1px]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 border-b-2 border-black flex flex-wrap items-center justify-between gap-2 bg-white">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase cursor-pointer">
          <input
            type="checkbox"
            checked={showRaw}
            onChange={(e) => setShowRaw(e.target.checked)}
            className="border-2 border-black"
          />
          Raw JSON
        </label>
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyPayload === undefined && tab === "outputs"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-[#FCD116] font-black uppercase text-[10px] brutalist-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 stroke-[3]" />
              Copy JSON
            </>
          )}
        </button>
      </div>

      <div className="p-4 min-h-[280px] max-h-[420px] overflow-y-auto">
        {tab === "inputs" && (
          <div className="space-y-4">
            {inputSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 border-b-2 border-black pb-1">
                  {section.title}
                </p>
                <JsonBlock data={section.payload} showRaw={showRaw} />
              </div>
            ))}
          </div>
        )}

        {tab === "outputs" && (
          <>
            {output === undefined && status !== "done" && (
              <p className="text-sm font-medium text-neutral-600 italic">
                {status === "running"
                  ? "Agent is working… output will appear when complete."
                  : "Output not available yet."}
              </p>
            )}
            {output !== undefined && !showRaw && (
              <OutputPreview agent={active} output={output} />
            )}
            {output !== undefined && showRaw && (
              <pre className="text-xs bg-[#0A0A0A] text-green-300 border-4 border-black p-4 overflow-x-auto font-mono">
                {JSON.stringify(output, null, 2)}
              </pre>
            )}
          </>
        )}

        {tab === "sources" && (
          <SourcesPanel
            agent={active}
            agentOutputs={agentOutputs}
            researchEvidence={resolvedResearchEvidence}
          />
        )}
      </div>
    </section>
  );
}

export { OutputPreview };
