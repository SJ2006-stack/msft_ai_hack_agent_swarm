"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Globe, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const SETUP_STEPS = [
  {
    id: "describe",
    step: "01",
    title: "DESCRIBE YOUR PRODUCT",
    icon: Globe,
    description:
      "Feed your company description, product value prop, and optional website URL. The Input Processor normalizes context for downstream agents.",
    visual: {
      label: "GTM INPUT FORM",
      lines: [
        "Company: B2B SaaS Sales Intelligence",
        "Product: AI pipeline analytics for mid-market",
        "URL: https://example.com",
      ],
    },
  },
  {
    id: "launch",
    step: "02",
    title: "LAUNCH THE SWARM",
    icon: Zap,
    description:
      "11 specialized agents spin up on LangGraph — GTM Strategist, Signal Hunter, Market Mapper, and more — executing in parallel where possible.",
    visual: {
      label: "LANGGRAPH PIPELINE",
      lines: [
        "▸ GTM Strategist → ICP personas",
        "▸ Mapper + Hunter (parallel)",
        "▸ Prospect Discovery → 14 accounts",
        "▸ Outreach Planner → sequences",
      ],
    },
  },
  {
    id: "review",
    step: "03",
    title: "REVIEW GTM REPORT",
    icon: FileText,
    description:
      "Get a structured report with ICP profiles, intent signals, qualified prospects, decision-maker contacts, and personalized outreach drafts.",
    visual: {
      label: "REPORT OUTPUT",
      lines: [
        "✓ 3 buyer personas mapped",
        "✓ 8 intent signals detected",
        "✓ 14 qualified prospects ranked",
        "✓ Outreach sequences ready",
      ],
    },
  },
] as const;

export function SwarmSetupStepper({ onLaunchClick }: { onLaunchClick: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(index);
          }
        },
        { threshold: 0.55, rootMargin: "-10% 0px -35% 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="border-b-4 border-black bg-white">
      <div className="grid lg:grid-cols-[minmax(280px,1fr)_1.4fr]">
        {/* Sticky left panel */}
        <div className="lg:sticky lg:top-0 lg:self-start border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-[#0A0A0A] text-[#FCD116] p-6 md:p-10 lg:min-h-screen lg:flex lg:flex-col lg:justify-center">
          <ScrollReveal>
            <span className="text-xs font-black uppercase tracking-widest text-neutral-500 block mb-2">
              3 STEPS TO GTM INTELLIGENCE
            </span>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none text-white mb-4">
              MINUTES TO
              <br />
              SET UP
            </h3>
            <p className="text-sm font-bold text-neutral-400 leading-relaxed mb-8 max-w-xs">
              From product description to qualified prospect list — no manual research sprints required.
            </p>
          </ScrollReveal>

          <nav className="space-y-3" aria-label="Setup steps">
            {SETUP_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() =>
                    stepRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                  className={cn(
                    "w-full text-left border-4 border-black p-4 transition-all duration-200 flex items-start gap-3",
                    isActive
                      ? "bg-[#FCD116] text-black brutalist-shadow-yellow"
                      : "bg-transparent text-neutral-500 hover:text-[#FCD116] hover:border-[#FCD116]/50"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs px-1.5 py-0.5 border-2 border-black font-black shrink-0",
                      isActive ? "bg-black text-[#FCD116]" : "bg-neutral-800 text-neutral-400"
                    )}
                  >
                    {step.step}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                      <span className="font-black text-sm uppercase">{step.title}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLaunchClick}
            className="mt-8 w-full py-3 bg-[#FCD116] text-black font-black text-sm border-4 border-black brutalist-shadow-yellow brutalist-btn-hover-yellow flex items-center justify-center gap-2 uppercase"
          >
            Start Now
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Scrolling right panels */}
        <div className="bg-[#FCD116]">
          {SETUP_STEPS.map((step, i) => (
            <div
              key={step.id}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="min-h-[70vh] lg:min-h-screen flex items-center p-6 md:p-12 border-b-4 border-black last:border-b-0"
            >
              <ScrollReveal delay={i * 80} className="w-full space-y-6">
                <div>
                  <span className="text-xs font-black uppercase text-neutral-600">
                    STEP {step.step}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-black uppercase mt-1 text-black">
                    {step.title}
                  </h4>
                  <p className="text-sm font-bold text-neutral-800 mt-3 max-w-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="bg-white border-4 border-black brutalist-shadow p-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b-2 border-black pb-2">
                    {step.visual.label}
                  </p>
                  {step.visual.lines.map((line) => (
                    <p
                      key={line}
                      className="text-xs sm:text-sm font-bold font-mono text-black border-l-4 border-[#FCD116] pl-3 py-1"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
