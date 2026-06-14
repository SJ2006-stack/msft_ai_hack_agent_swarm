"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AgentOutputs } from "@/server/export/agent-outputs";
import {
  AGENT_LABELS,
  AGENT_NAMES,
  type AgentName,
  type AgentStatuses,
} from "@/types/agents";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion-presets";
import {
  OutputContentView,
  OutputViewMode,
  OutputViewToggle,
} from "@/components/swarm/output-view";

type Props = {
  agentStatuses: AgentStatuses;
  agentOutputs: AgentOutputs;
  selectedAgent: AgentName | null;
  onSelectAgent: (agent: AgentName) => void;
};

const statusDot: Record<string, string> = {
  pending: "bg-neutral-300",
  running: "bg-[#FCD116] animate-pulse",
  done: "bg-green-500",
  error: "bg-red-500",
};

export function AgentOutputExplorer({
  agentStatuses,
  agentOutputs,
  selectedAgent,
  onSelectAgent,
}: Props) {
  const [viewMode, setViewMode] = useState<OutputViewMode>("text");
  const active = selectedAgent ?? AGENT_NAMES.find((a) => agentOutputs[a]) ?? AGENT_NAMES[0];
  const output = agentOutputs[active];
  const status = agentStatuses[active];

  return (
    <section className="brutalist-report-explorer bg-white border-4 border-black brutalist-shadow overflow-hidden">
      <div className="px-4 py-3 border-b-4 border-black flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-display font-bold text-black">Output explorer</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Browse each agent&apos;s result</p>
        </div>
        <OutputViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] min-h-[320px]">
        <div className="border-b-4 lg:border-b-0 lg:border-r-4 border-black p-2 space-y-1 max-h-[360px] overflow-y-auto bg-[#FCD116]/20">
          {AGENT_NAMES.map((agent) => {
            const hasOutput = agentOutputs[agent] !== undefined;
            const agentStatus = agentStatuses[agent];

            return (
              <motion.button
                key={agent}
                type="button"
                layout
                onClick={() => onSelectAgent(agent)}
                whileHover={{ x: -1 }}
                whileTap={{ scale: 0.99 }}
                transition={springSnappy}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 border-2 border-transparent",
                  active === agent
                    ? "bg-[#FCD116] text-black border-black font-semibold"
                    : "hover:bg-white text-neutral-800",
                  !hasOutput && agentStatus === "pending" && "opacity-50"
                )}
              >
                <motion.span
                  layout
                  animate={agentStatus === "running" ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                  transition={
                    agentStatus === "running"
                      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      : springSnappy
                  }
                  className={cn("w-2 h-2 rounded-full shrink-0 border border-black", statusDot[agentStatus])}
                />
                <span className="truncate">{AGENT_LABELS[agent]}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="p-4 overflow-y-auto max-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={springSnappy}
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-black">{AGENT_LABELS[active]}</h3>
                <span className="text-xs px-2 py-0.5 border-2 border-black capitalize bg-white">
                  {status}
                </span>
              </div>

              {!output && status !== "done" && (
                <p className="text-sm text-neutral-600 italic">
                  {status === "running"
                    ? "Agent is working — output appears when done."
                    : "No output yet."}
                </p>
              )}

              {output !== undefined && (
                <OutputContentView agent={active} data={output} mode={viewMode} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
