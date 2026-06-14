"use client";

import { useMemo, useState } from "react";
import type {
  Prospect,
  OpportunityScore,
  DecisionMaker,
  OutreachStrategy,
} from "@/types/gtm";
import type { AgentName } from "@/types/agents";
import { CitationChipList } from "@/components/report/citation-chip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = {
  prospects: Prospect[];
  opportunities: OpportunityScore[];
  decisionMakers: DecisionMaker[];
  outreachStrategies?: OutreachStrategy[];
  onJumpToAgent?: (agent: AgentName) => void;
};

type PriorityFilter = "all" | OpportunityScore["priority"];
type SortKey = "fit_score" | "overall_score";

function formatWebsiteUrl(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function priorityBadgeClass(priority: OpportunityScore["priority"]) {
  if (priority === "high")
    return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50";
  if (priority === "medium")
    return "bg-amber-950/40 text-amber-400 border border-amber-900/50";
  return "bg-neutral-800 text-neutral-400 border border-neutral-700";
}

export function ProspectsReportSection({
  prospects,
  opportunities,
  decisionMakers,
  outreachStrategies = [],
  onJumpToAgent,
}: Props) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [minFit, setMinFit] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("fit_score");

  const filteredProspects = useMemo(() => {
    const rows = prospects
      .map((p) => {
        const opp = opportunities.find((o) => o.company_name === p.company_name);
        return { prospect: p, opportunity: opp };
      })
      .filter(({ prospect, opportunity }) => {
        if (prospect.fit_score < minFit) return false;
        if (priorityFilter === "all") return true;
        return opportunity?.priority === priorityFilter;
      });

    rows.sort((a, b) => {
      if (sortBy === "fit_score") {
        return b.prospect.fit_score - a.prospect.fit_score;
      }
      const aScore = a.opportunity?.overall_score ?? 0;
      const bScore = b.opportunity?.overall_score ?? 0;
      return bScore - aScore;
    });

    return rows;
  }, [prospects, opportunities, priorityFilter, minFit, sortBy]);

  async function copyOutreach(companyName: string) {
    const strategy = outreachStrategies.find((s) => s.company_name === companyName);
    if (!strategy) {
      showToast("No outreach draft for this prospect");
      return;
    }
    const text = `Subject: ${strategy.outreach_angle}\n\n${strategy.email_draft}\n\n--- LinkedIn ---\n${strategy.linkedin_draft}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Outreach copied");
    } catch {
      showToast("Copy failed");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Qualified Prospects</h2>
        {onJumpToAgent && (
          <button
            type="button"
            onClick={() => onJumpToAgent("prospect_discovery")}
            className="text-xs font-bold uppercase tracking-wide text-[#FCD116] hover:underline"
          >
            View in Prospect Discovery →
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Priority
          </span>
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`rounded border px-2 py-1 text-xs capitalize transition-colors ${
                priorityFilter === p
                  ? "border-[#FCD116] bg-[#FCD116]/10 text-[#FCD116]"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <label htmlFor="min-fit" className="shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Min fit {minFit}%
          </label>
          <input
            id="min-fit"
            type="range"
            min={0}
            max={100}
            value={minFit}
            onChange={(e) => setMinFit(Number(e.target.value))}
            className="h-1.5 w-full accent-[#FCD116]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sort
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-300"
          >
            <option value="fit_score">Fit score</option>
            <option value="overall_score">Overall score</option>
          </select>
        </div>

        <span className="text-xs text-neutral-500">
          {filteredProspects.length} of {prospects.length}
        </span>
      </div>

      <div className="space-y-2">
        {filteredProspects.length === 0 && (
          <p className="rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-6 text-center text-sm text-neutral-500">
            No prospects match the current filters.
          </p>
        )}

        {filteredProspects.map(({ prospect: p, opportunity: opp }) => {
          const dm = decisionMakers.find((d) => d.company_name === p.company_name);
          const isOpen = expanded === p.company_name;
          const hasOutreach = outreachStrategies.some((s) => s.company_name === p.company_name);

          return (
            <div
              key={p.company_name}
              className="overflow-hidden rounded-lg border border-neutral-800"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : p.company_name)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-neutral-900/40"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-white">{p.company_name}</span>
                  <span className="text-neutral-400">{p.industry}</span>
                  {p.website && (
                    <a
                      href={formatWebsiteUrl(p.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                    >
                      {p.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="text-neutral-300">Fit {p.fit_score}%</span>
                  {opp && (
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${priorityBadgeClass(opp.priority)}`}
                    >
                      {opp.priority} ({opp.overall_score})
                    </span>
                  )}
                  {dm && (
                    <span className="max-w-[200px] truncate text-neutral-400">{dm.title}</span>
                  )}
                  <span className="ml-auto text-xs text-neutral-500">
                    {isOpen ? "▲ Hide" : "▼ Details"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-neutral-800 bg-neutral-900/30 px-4 pb-4 pt-3 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        ICP Match
                      </p>
                      <p className="leading-relaxed text-neutral-300">{p.icp_match}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Match Rationale
                      </p>
                      <p className="leading-relaxed text-neutral-300">{p.match_rationale}</p>
                    </div>
                  </div>

                  <CitationChipList citations={p.citations} />

                  {opp && (
                    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                          Opportunity Score
                        </p>
                        <span
                          className={`rounded border px-2 py-0.5 text-xs ${priorityBadgeClass(opp.priority)}`}
                        >
                          {opp.priority} priority · {opp.overall_score} overall
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ScoreBar label="Fit" score={opp.fit_score} />
                        <ScoreBar label="Intent" score={opp.intent_score} />
                        <ScoreBar label="Timing" score={opp.timing_score} />
                        <ScoreBar label="Accessibility" score={opp.accessibility_score} />
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">{opp.rationale}</p>
                    </div>
                  )}

                  {dm && (
                    <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Decision Maker
                      </p>
                      <p className="font-semibold text-white">{dm.title}</p>
                      <p className="text-neutral-300">
                        <span className="font-medium text-neutral-400">Role:</span> {dm.role}
                      </p>
                      <p className="text-neutral-300">
                        <span className="font-medium text-neutral-400">Relevance:</span>{" "}
                        {dm.relevance}
                      </p>
                      <p className="text-neutral-300">
                        <span className="font-medium text-neutral-400">Approach:</span>{" "}
                        {dm.recommended_approach}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {hasOutreach && (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="h-8 px-3 text-xs"
                        onClick={() => copyOutreach(p.company_name)}
                      >
                        Copy outreach
                      </Button>
                    )}
                    {onJumpToAgent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="h-8 px-3 text-xs"
                        onClick={() => onJumpToAgent("prospect_discovery")}
                      >
                        Jump to agent
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
