"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { GTMInput } from "@/types/gtm";

const PREVIEW_LEN = 500;

type Props = {
  input: GTMInput | null;
  websiteContent?: string | null;
};

export function InputSummary({ input, websiteContent }: Props) {
  const [showCrawl, setShowCrawl] = useState(false);
  const excerpt =
    websiteContent && websiteContent.length > PREVIEW_LEN
      ? `${websiteContent.slice(0, PREVIEW_LEN)}…`
      : websiteContent;

  if (!input) {
    return (
      <section className="bg-white border-4 border-black p-5 brutalist-shadow">
        <h2 className="text-xl font-display font-black uppercase text-black tracking-tight border-b-2 border-black pb-2">
          Your Input
        </h2>
        <p className="text-sm font-medium text-neutral-600 animate-pulse">
          Loading submitted input…
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border-4 border-black p-5 brutalist-shadow space-y-4">
      <h2 className="text-xl font-display font-black uppercase text-black tracking-tight border-b-2 border-black pb-2">
        Your Input
      </h2>

      <dl className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="space-y-1">
          <dt className="text-xs font-black uppercase tracking-wide text-neutral-600">Company</dt>
          <dd className="font-bold text-black">{input.company}</dd>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-xs font-black uppercase tracking-wide text-neutral-600">Product</dt>
          <dd className="font-medium text-black leading-relaxed">{input.product}</dd>
        </div>
        {input.url && (
          <div className="space-y-1 sm:col-span-3">
            <dt className="text-xs font-black uppercase tracking-wide text-neutral-600">Website</dt>
            <dd>
              <a
                href={input.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-bold underline decoration-2 underline-offset-2 hover:text-neutral-700"
              >
                {input.url}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {websiteContent && (
        <div className="border-t-2 border-black pt-3">
          <button
            type="button"
            onClick={() => setShowCrawl((v) => !v)}
            className="flex w-full items-center justify-between text-left font-black uppercase text-xs tracking-wide hover:text-neutral-700"
          >
            Website crawl preview
            {showCrawl ? (
              <ChevronUp className="h-4 w-4 stroke-[3]" />
            ) : (
              <ChevronDown className="h-4 w-4 stroke-[3]" />
            )}
          </button>
          {showCrawl && (
            <pre className="mt-3 max-h-48 overflow-auto border-2 border-black bg-neutral-50 p-3 text-xs font-medium leading-relaxed whitespace-pre-wrap text-black">
              {excerpt}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
