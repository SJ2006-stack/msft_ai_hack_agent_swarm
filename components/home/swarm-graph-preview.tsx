"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AgentFlowGraph } from "@/components/swarm/agent-flow-graph-dynamic";
import {
  AGENT_NAMES,
  createInitialAgentStatuses,
  type AgentName,
  type AgentStatuses,
} from "@/types/agents";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { fadeUp, springSnappy, staggerContainer } from "@/lib/motion-presets";

const DEMO_SEQUENCE: AgentName[] = [
  "input_processor",
  "gtm_strategist",
  "market_mapper",
  "signal_hunter",
  "join_research",
  "prospect_discovery",
  "decision_maker_finder",
  "opportunity_scorer",
  "join_qualify",
  "outreach_planner",
  "report_assembler",
];

function buildDemoStatuses(activeIndex: number): AgentStatuses {
  const statuses = createInitialAgentStatuses();

  DEMO_SEQUENCE.forEach((agent, i) => {
    if (i < activeIndex) statuses[agent] = "done";
    else if (i === activeIndex) statuses[agent] = "running";
  });

  return statuses;
}

export function SwarmGraphPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (DEMO_SEQUENCE.length + 2));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const agentStatuses = useMemo(
    () => buildDemoStatuses(Math.min(activeIndex, DEMO_SEQUENCE.length - 1)),
    [activeIndex]
  );

  const doneCount = Object.values(agentStatuses).filter((s) => s === "done").length;

  return (
    <section id="architecture-section" className="relative border-b-4 border-black overflow-hidden">
      <MeshGradient variant="dark" className="opacity-40" />

      <div className="relative p-6 md:p-12 space-y-8 bg-[#FCD116]/95">
        <ScrollReveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-black pb-4 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600 block">
              Agent graph
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-1">
              Pipeline topology
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="bg-black text-[#FCD116] px-3 py-1.5 border-2 border-black">
              {AGENT_NAMES.length} agents
            </span>
            <motion.span
              key={doneCount}
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springSnappy}
              className="bg-white text-black px-3 py-1.5 border-2 border-black brutalist-shadow"
            >
              {doneCount}/{AGENT_NAMES.length} in preview
            </motion.span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="border-4 border-black brutalist-shadow-lg overflow-hidden">
            <AgentFlowGraph agentStatuses={agentStatuses} />
          </div>
        </ScrollReveal>

        {/* Compact step cards for mobile fallback context */}
        <ScrollReveal delay={200}>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {[
              { step: "01", name: "GTM Strategist", status: "ICP & personas" },
              { step: "02", name: "Mapper & Hunter", status: "Parallel research" },
              { step: "03", name: "Prospect Discovery", status: "Account fit" },
              { step: "04", name: "Finder & Scorer", status: "Ranking" },
              { step: "05", name: "Outreach Planner", status: "Drafts" },
            ].map((p) => (
              <motion.div
                key={p.step}
                variants={fadeUp}
                transition={springSnappy}
                whileHover={{ x: -2, y: -2 }}
                className="bg-white border-4 border-black p-3 brutalist-shadow flex flex-col justify-between min-h-[100px]"
              >
                <span className="font-mono text-[10px] bg-black text-[#FCD116] px-1 py-0.5 border border-black font-black w-fit">
                  {p.step}
                </span>
                <div>
                  <h4 className="font-bold text-[11px] leading-tight mt-2">{p.name}</h4>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{p.status}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
