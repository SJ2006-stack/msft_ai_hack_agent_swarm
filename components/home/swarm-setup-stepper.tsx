"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Globe, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const SETUP_STEPS = [
  {
    id: "describe",
    step: "01",
    title: "Describe your product",
    icon: Globe,
    description:
      "Company name, product pitch, and optional website URL. The input processor normalizes this for downstream agents.",
    visual: {
      label: "Input",
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
    title: "Run the swarm",
    icon: Zap,
    description:
      "Eleven agents execute on LangGraph — strategy, research, discovery, scoring, and outreach — with parallel branches where possible.",
    visual: {
      label: "Pipeline",
      lines: [
        "GTM Strategist → ICP & personas",
        "Market Mapper + Signal Hunter (parallel)",
        "Prospect Discovery → ranked accounts",
        "Outreach Planner → sequences",
      ],
    },
  },
  {
    id: "review",
    step: "03",
    title: "Review the report",
    icon: FileText,
    description:
      "Structured output: ICPs, signals, prospects, decision makers, and outreach drafts you can export.",
    visual: {
      label: "Output",
      lines: [
        "3 buyer personas",
        "8 intent signals",
        "14 ranked prospects",
        "Outreach sequences",
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
          if (entry.isIntersecting) setActiveStep(index);
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
        <div className="lg:sticky lg:top-0 lg:self-start border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-[#0A0A0A] text-[#FCD116] p-6 md:p-10 lg:min-h-screen lg:flex lg:flex-col lg:justify-center">
          <ScrollReveal>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 block mb-2">
              How it works
            </span>
            <h3 className="text-3xl md:text-4xl font-black leading-none text-white mb-4">
              Three steps
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-8 max-w-xs">
              From product description to a prospect list and outreach drafts.
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
                      "font-mono text-xs px-1.5 py-0.5 border-2 border-black font-bold shrink-0",
                      isActive ? "bg-black text-[#FCD116]" : "bg-neutral-800 text-neutral-400"
                    )}
                  >
                    {step.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                    <span className="font-semibold text-sm">{step.title}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLaunchClick}
            className="mt-8 w-full py-3 bg-[#FCD116] text-black font-semibold text-sm border-4 border-black brutalist-shadow-yellow brutalist-btn-hover-yellow flex items-center justify-center gap-2"
          >
            Start a run
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

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
                  <span className="text-xs font-semibold text-neutral-600">
                    Step {step.step}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-bold mt-1 text-black">
                    {step.title}
                  </h4>
                  <p className="text-sm text-neutral-800 mt-3 max-w-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="bg-white border-4 border-black brutalist-shadow p-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 border-b-2 border-black pb-2">
                    {step.visual.label}
                  </p>
                  {step.visual.lines.map((line) => (
                    <p
                      key={line}
                      className="text-xs sm:text-sm font-mono text-black border-l-4 border-[#FCD116] pl-3 py-1"
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
