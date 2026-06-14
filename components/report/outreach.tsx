"use client";

import { useState } from "react";
import type { OutreachStrategy } from "@/types/gtm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = {
  strategies: OutreachStrategy[];
};

type DraftTab = "email" | "linkedin";

function CopyButton({ text, label }: { text: string; label: string }) {
  const { showToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      showToast("Copy failed");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="h-7 px-2 text-xs"
      onClick={handleCopy}
    >
      Copy {label}
    </Button>
  );
}

function StrategyCard({ strategy }: { strategy: OutreachStrategy }) {
  const [tab, setTab] = useState<DraftTab>("email");
  const draft = tab === "email" ? strategy.email_draft : strategy.linkedin_draft;
  const charCount = draft.length;

  return (
    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="font-medium text-white">{strategy.company_name}</h3>
      <p className="text-sm text-neutral-300">
        <span className="font-medium text-neutral-400">Angle:</span>{" "}
        {strategy.outreach_angle}
      </p>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded border border-blue-900/30 bg-blue-950/20 p-3">
          <p className="font-semibold text-blue-400">Why Now</p>
          <p className="mt-1 text-neutral-300">{strategy.why_now}</p>
        </div>
        <div className="rounded border border-emerald-900/30 bg-emerald-950/20 p-3">
          <p className="font-semibold text-emerald-400">Why Them</p>
          <p className="mt-1 text-neutral-300">{strategy.why_them}</p>
        </div>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/50 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 px-3 py-2">
          <div className="flex gap-1">
            {(["email", "linkedin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "bg-[#FCD116] text-[#0A0A0A]"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t === "email" ? "Email" : "LinkedIn"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{charCount} chars</span>
            <CopyButton
              text={draft}
              label={tab === "email" ? "email" : "LinkedIn"}
            />
          </div>
        </div>
        <p className="whitespace-pre-wrap px-3 py-3 leading-relaxed text-neutral-400">
          {draft}
        </p>
      </div>
    </div>
  );
}

export function OutreachReportSection({ strategies }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Outreach Strategies</h2>
      {strategies.map((s) => (
        <StrategyCard key={s.company_name} strategy={s} />
      ))}
    </section>
  );
}
