"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type ChatMessage = {
  id: string;
  agent: string;
  role: "system" | "agent";
  text: string;
};

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    agent: "INPUT PROCESSOR",
    role: "system",
    text: "Parsing company profile: B2B SaaS sales intelligence platform targeting mid-market revenue teams.",
  },
  {
    id: "m2",
    agent: "GTM STRATEGIST",
    role: "agent",
    text: "Mapped 3 ICP personas — VP Sales, CRO, and RevOps — with pain points around pipeline visibility and rep productivity.",
  },
  {
    id: "m3",
    agent: "SIGNAL HUNTER",
    role: "agent",
    text: "Intent trigger: Series B funding at Acme Corp + 12 new SDR hires in the last 30 days.",
  },
  {
    id: "m4",
    agent: "PROSPECT DISCOVERY",
    role: "agent",
    text: "Qualified 14 accounts matching enterprise security ICP with active buying signals.",
  },
  {
    id: "m5",
    agent: "OUTREACH PLANNER",
    role: "agent",
    text: "Drafted personalized email sequence for VP Sales — references their Q2 expansion and hiring spike.",
  },
];

function ChatBubble({
  message,
  visible,
  index,
}: {
  message: ChatMessage;
  visible: boolean;
  index: number;
}) {
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "chat-bubble-reveal flex",
        isSystem ? "justify-center" : index % 2 === 0 ? "justify-start" : "justify-end",
        visible && "is-visible"
      )}
      style={{ transitionDelay: `${index * 180}ms` }}
    >
      <div
        className={cn(
          "max-w-[90%] sm:max-w-[75%] border-4 border-black p-3 sm:p-4 brutalist-shadow",
          isSystem
            ? "bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider"
            : index % 2 === 0
              ? "bg-white text-black"
              : "bg-[#0A0A0A] text-[#FCD116]"
        )}
      >
        {!isSystem && (
          <p className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-70">
            {message.agent}
          </p>
        )}
        <p className={cn("leading-relaxed", isSystem ? "text-center" : "text-xs sm:text-sm font-bold")}>
          {message.text}
        </p>
      </div>
    </div>
  );
}

export function SwarmChatDemo() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    setRevealedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    DEMO_MESSAGES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setRevealedCount((c) => Math.max(c, i + 1));
        }, i * 220)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  return (
    <section className="bg-[#FCD116] border-b-4 border-black p-6 md:p-12">
      <ScrollReveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-black pb-4 gap-4 mb-8">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600 block">
            LIVE AGENT DIALOGUE
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-black">
            SWARM ACTIVITY FEED
          </h3>
        </div>
        <p className="text-sm font-bold max-w-sm text-neutral-800 leading-tight">
          Sequential agent outputs as they coordinate over shared LangGraph state — same stream you see during a live run.
        </p>
      </ScrollReveal>

      <div
        ref={ref}
        className="bg-white border-4 border-black brutalist-shadow-lg p-4 sm:p-6 space-y-4 min-h-[320px]"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-2">
          <span className="text-xs font-black uppercase">Swarm Terminal Preview</span>
          <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            SIMULATED RUN
          </span>
        </div>

        {DEMO_MESSAGES.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            index={i}
            visible={i < revealedCount}
          />
        ))}
      </div>
    </section>
  );
}
