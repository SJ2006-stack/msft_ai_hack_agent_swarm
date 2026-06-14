"use client";

import { useMemo, useState } from "react";
import type { BuyingSignal } from "@/types/gtm";
import type { AgentName } from "@/types/agents";
import { CitationChipList } from "@/components/report/citation-chip";
import { Button } from "@/components/ui/button";

type Props = {
  signals: BuyingSignal[];
  intentIndicators: string[];
  onJumpToAgent?: (agent: AgentName) => void;
};

type UrgencyFilter = "all" | BuyingSignal["urgency"];

function urgencyBadgeClass(urgency: BuyingSignal["urgency"]) {
  if (urgency === "high")
    return "bg-red-950/40 text-red-400 border-red-900/50";
  if (urgency === "medium")
    return "bg-amber-950/40 text-amber-400 border-amber-900/50";
  return "bg-neutral-800 text-neutral-400 border-neutral-700";
}

export function SignalsReportSection({
  signals,
  intentIndicators,
  onJumpToAgent,
}: Props) {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filteredSignals = useMemo(() => {
    if (urgencyFilter === "all") return signals;
    return signals.filter((s) => s.urgency === urgencyFilter);
  }, [signals, urgencyFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Buying Signals</h2>
        {onJumpToAgent && (
          <button
            type="button"
            onClick={() => onJumpToAgent("signal_hunter")}
            className="text-xs font-bold uppercase tracking-wide text-[#FCD116] hover:underline"
          >
            View in Signal Hunter →
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Urgency
        </span>
        {(["all", "high", "medium", "low"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUrgencyFilter(u)}
            className={`rounded border px-2 py-1 text-xs capitalize transition-colors ${
              urgencyFilter === u
                ? "border-[#FCD116] bg-[#FCD116]/10 text-[#FCD116]"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            }`}
          >
            {u}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-500">
          {filteredSignals.length} of {signals.length}
        </span>
      </div>

      <div className="grid gap-3">
        {filteredSignals.length === 0 && (
          <p className="rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-6 text-center text-sm text-neutral-500">
            No signals match the current filter.
          </p>
        )}

        {filteredSignals.map((s, i) => {
          const isOpen = expanded === i;

          return (
            <div
              key={`${s.signal_type}-${i}`}
              className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/30"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                className="flex w-full items-start justify-between p-4 text-left transition-colors hover:bg-neutral-900/50"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {s.signal_type}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{s.description}</p>
                </div>
                <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`rounded border px-2 py-1 text-xs capitalize ${urgencyBadgeClass(s.urgency)}`}
                  >
                    {s.urgency}
                  </span>
                  <span className="text-xs text-neutral-500">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-neutral-800 px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-neutral-300">{s.description}</p>
                  {s.source && (
                    <p className="text-xs text-neutral-500">Source: {s.source}</p>
                  )}
                  <CitationChipList citations={s.citations} />
                  {onJumpToAgent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-8 px-3 text-xs"
                      onClick={() => onJumpToAgent("signal_hunter")}
                    >
                      View in Signal Hunter
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {intentIndicators.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium text-neutral-200">Intent Indicators</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-300">
            {intentIndicators.map((ind) => (
              <li key={ind}>{ind}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
