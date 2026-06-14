"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { bubbleIn, springSnappy, staggerContainer } from "@/lib/motion-presets";

type ChatMessage = {
  id: string;
  agent: string;
  role: "system" | "agent";
  text: string;
};

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    agent: "Input Processor",
    role: "system",
    text: "Parsed company profile: B2B SaaS sales intelligence platform for mid-market revenue teams.",
  },
  {
    id: "m2",
    agent: "GTM Strategist",
    role: "agent",
    text: "Mapped 3 ICP personas — VP Sales, CRO, RevOps — with pipeline visibility and rep productivity pain points.",
  },
  {
    id: "m3",
    agent: "Signal Hunter",
    role: "agent",
    text: "Series B funding at Acme Corp plus 12 new SDR hires in the last 30 days.",
  },
  {
    id: "m4",
    agent: "Prospect Discovery",
    role: "agent",
    text: "14 accounts matched the enterprise security ICP with active buying signals.",
  },
  {
    id: "m5",
    agent: "Outreach Planner",
    role: "agent",
    text: "Drafted email sequence for VP Sales referencing Q2 expansion and hiring spike.",
  },
];

function ChatBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isSystem = message.role === "system";

  return (
    <motion.div
      variants={bubbleIn}
      transition={springSnappy}
      className={cn(
        "flex",
        isSystem ? "justify-center" : index % 2 === 0 ? "justify-start" : "justify-end"
      )}
    >
      <motion.div
        whileHover={{ x: -2, y: -2 }}
        transition={springSnappy}
        className={cn(
          "max-w-[90%] sm:max-w-[75%] border-4 border-black p-3 sm:p-4 brutalist-shadow",
          isSystem
            ? "bg-neutral-100 text-neutral-600 text-xs"
            : index % 2 === 0
              ? "bg-white text-black"
              : "bg-[#0A0A0A] text-[#FCD116]"
        )}
      >
        {!isSystem && (
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">
            {message.agent}
          </p>
        )}
        <p className={cn("leading-relaxed", isSystem ? "text-center" : "text-xs sm:text-sm")}>
          {message.text}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function SwarmChatDemo() {
  return (
    <section className="bg-[#FCD116] border-b-4 border-black p-6 md:p-12">
      <ScrollReveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-black pb-4 gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600 block">
            Example output
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-black">
            What a run looks like
          </h3>
        </div>
        <p className="text-sm max-w-sm text-neutral-800 leading-tight">
          Agent messages from a sample run — same format as the live activity log.
        </p>
      </ScrollReveal>

      <motion.div
        className="bg-white border-4 border-black brutalist-shadow-lg p-4 sm:p-6 space-y-4 min-h-[320px]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={staggerContainer}
      >
        <div className="border-b-2 border-black pb-3 mb-2">
          <span className="text-xs font-semibold uppercase">Activity log</span>
        </div>

        {DEMO_MESSAGES.map((msg, i) => (
          <ChatBubble key={msg.id} message={msg} index={i} />
        ))}
      </motion.div>
    </section>
  );
}
