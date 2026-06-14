"use client";

import { CitationChip } from "@/components/report/citation-chip";
import type { AgentName } from "@/types/agents";
import type { Citation, GTMInput } from "@/types/gtm";
import { cn } from "@/lib/utils";

export type OutputViewMode = "text" | "json";

type ToggleProps = {
  mode: OutputViewMode;
  onChange: (mode: OutputViewMode) => void;
};

export function OutputViewToggle({ mode, onChange }: ToggleProps) {
  return (
    <div
      className="inline-flex border-2 border-black brutalist-shadow"
      role="group"
      aria-label="Output format"
    >
      {(["text", "json"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 font-black uppercase text-[10px] transition-transform",
            mode === option
              ? "bg-[#0A0A0A] text-[#FCD116]"
              : "bg-white text-black hover:translate-x-[-1px] hover:translate-y-[-1px]"
          )}
        >
          {option === "text" ? "Text" : "JSON"}
        </button>
      ))}
    </div>
  );
}

export function JsonOutputView({ data }: { data: unknown }) {
  return (
    <pre className="text-xs bg-[#0A0A0A] text-green-300 border-4 border-black p-4 overflow-x-auto font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 border-b-2 border-black pb-1">
      {children}
    </p>
  );
}

type MarketSegmentView = {
  name: string;
  description: string;
  opportunity_size: string;
  rationale: string;
};

function MarketList({
  title,
  markets,
}: {
  title: string;
  markets: MarketSegmentView[];
}) {
  if (!markets.length) return null;
  return (
    <div className="space-y-2">
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-3">
        {markets.map((market) => (
          <li key={market.name} className="text-sm border-l-4 border-black pl-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black uppercase text-black">{market.name}</p>
              <span className="text-[10px] font-black uppercase border-2 border-black px-1.5 py-0.5 bg-[#FCD116]">
                {market.opportunity_size}
              </span>
            </div>
            <p className="font-medium text-neutral-800 mt-0.5">{market.description}</p>
            <p className="text-xs font-medium text-neutral-600 mt-1">{market.rationale}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GtmInputView({ input }: { input: GTMInput }) {
  return (
    <dl className="grid gap-3 text-sm">
      <div>
        <dt className="text-[10px] font-black uppercase text-neutral-600">Company</dt>
        <dd className="font-bold text-black">{input.company}</dd>
      </div>
      <div>
        <dt className="text-[10px] font-black uppercase text-neutral-600">Product</dt>
        <dd className="font-medium text-black leading-relaxed">{input.product}</dd>
      </div>
      {input.url && (
        <div>
          <dt className="text-[10px] font-black uppercase text-neutral-600">Website</dt>
          <dd className="font-mono text-xs font-bold text-black break-all">{input.url}</dd>
        </div>
      )}
    </dl>
  );
}

function isGtmInput(value: unknown): value is GTMInput {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.company === "string" && typeof row.product === "string";
}

export function PayloadTextView({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className="text-sm font-medium text-neutral-600 italic">Not available yet.</p>;
  }

  if (typeof data === "string") {
    return (
      <p className="text-sm font-medium text-black whitespace-pre-wrap leading-relaxed">{data}</p>
    );
  }

  if (isGtmInput(data)) {
    return <GtmInputView input={data} />;
  }

  if (typeof data === "object") {
    const row = data as Record<string, unknown>;

    if (Array.isArray(row.results)) {
      return (
        <ol className="space-y-2 list-decimal list-inside text-sm">
          {(row.results as Array<{ id?: number; title: string; url: string; excerpt?: string }>).map(
            (result, index) => (
              <li key={`${result.url}-${index}`} className="border-2 border-black p-2 bg-[#FCD116]/20">
                <p className="font-black text-black">
                  {result.id ? `${result.id}. ` : ""}
                  {result.title}
                </p>
                <p className="font-mono text-xs text-neutral-700 break-all">{result.url}</p>
                {result.excerpt && (
                  <p className="font-medium text-neutral-800 mt-1">{result.excerpt}</p>
                )}
              </li>
            )
          )}
        </ol>
      );
    }

    if (Array.isArray(row.highlights)) {
      return (
        <div className="space-y-2 text-sm">
          {typeof row.signal_count === "number" && (
            <p className="font-bold text-black">{row.signal_count} signal(s) detected</p>
          )}
          {Array.isArray(row.intent_indicators) && row.intent_indicators.length > 0 && (
            <p className="font-medium text-neutral-800">
              Intent: {(row.intent_indicators as string[]).join(", ")}
            </p>
          )}
          <ul className="space-y-2">
            {(row.highlights as Array<{ signal_type: string; urgency: string; description: string }>).map(
              (signal, index) => (
                <li key={index} className="border-l-4 border-black pl-3">
                  <span className="font-black text-black">{signal.signal_type}</span>
                  <span className="text-neutral-600 font-bold"> · {signal.urgency}</span>
                  <p className="font-medium text-neutral-800">{signal.description}</p>
                </li>
              )
            )}
          </ul>
        </div>
      );
    }

    if (Array.isArray(row.top_prospects)) {
      return (
        <div className="space-y-2 text-sm">
          {typeof row.prospect_count === "number" && (
            <p className="font-bold text-black">{row.prospect_count} prospect(s)</p>
          )}
          <ul className="space-y-2">
            {(
              row.top_prospects as Array<{
                company_name: string;
                industry: string;
                fit_score: number;
              }>
            ).map((prospect) => (
              <li key={prospect.company_name} className="flex justify-between gap-2 border-b border-black/20 pb-2">
                <span className="font-black text-black">{prospect.company_name}</span>
                <span className="font-bold text-neutral-700 shrink-0">
                  {prospect.industry} · {prospect.fit_score}% fit
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (
      typeof row.icp_count === "number" ||
      typeof row.prospect_count === "number" ||
      typeof row.signal_count === "number"
    ) {
      const stats = [
        ["ICPs", row.icp_count],
        ["Primary markets", row.primary_market_count],
        ["Signals", row.signal_count],
        ["Prospects", row.prospect_count],
        ["Decision makers", row.decision_maker_count],
        ["Opportunities", row.opportunity_count],
        ["Outreach plans", row.outreach_count],
      ] as const;

      return (
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          {stats.map(([label, count]) =>
            typeof count === "number" ? (
              <div key={label} className="border-2 border-black p-2 bg-white">
                <dt className="text-[10px] font-black uppercase text-neutral-600">{label}</dt>
                <dd className="text-2xl font-black text-black">{count}</dd>
              </div>
            ) : null
          )}
        </dl>
      );
    }
  }

  return <StructuredTextView data={data} />;
}

function StructuredTextView({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className="text-sm font-medium text-neutral-600 italic">Not available yet.</p>;
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return <p className="text-sm font-medium text-black">{String(data)}</p>;
  }

  if (Array.isArray(data)) {
    if (!data.length) {
      return <p className="text-sm font-medium text-neutral-600 italic">Empty list.</p>;
    }
    return (
      <ul className="space-y-2 text-sm">
        {data.map((item, index) => (
          <li key={index} className="border-l-4 border-black pl-3">
            <StructuredTextView data={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, value]) => value !== null && value !== undefined
    );
    if (!entries.length) {
      return <p className="text-sm font-medium text-neutral-600 italic">No data.</p>;
    }
    return (
      <dl className="space-y-3 text-sm">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[10px] font-black uppercase text-neutral-600">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="mt-1">
              <StructuredTextView data={value} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="text-sm font-medium text-black">{String(data)}</p>;
}

export function AgentOutputTextView({
  agent,
  output,
}: {
  agent: AgentName;
  output: unknown;
}) {
  if (output === null || output === undefined) {
    return <p className="text-sm font-medium text-neutral-600 italic">No output data.</p>;
  }

  if (typeof output !== "object") {
    return <p className="text-sm font-medium text-black">{String(output)}</p>;
  }

  const data = output as Record<string, unknown>;

  if (agent === "input_processor") {
    const input = data.input;
    const websiteContent =
      typeof data.website_content === "string" ? data.website_content : null;

    return (
      <div className="space-y-4">
        {isGtmInput(input) && <GtmInputView input={input} />}
        {websiteContent && (
          <div className="space-y-2">
            <SectionTitle>Website content</SectionTitle>
            <p className="text-sm font-medium text-black whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border-2 border-black bg-neutral-50 p-3">
              {websiteContent.length > 1200
                ? `${websiteContent.slice(0, 1200).trim()}…`
                : websiteContent}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (agent === "gtm_strategist" && Array.isArray(data.icps)) {
    return (
      <div className="space-y-4">
        {typeof data.value_proposition === "string" && (
          <div className="space-y-1">
            <SectionTitle>Value proposition</SectionTitle>
            <p className="text-sm font-medium text-black leading-relaxed">{data.value_proposition}</p>
          </div>
        )}
        <div className="space-y-2">
          <SectionTitle>ICPs</SectionTitle>
          <ul className="space-y-2">
            {(data.icps as Array<{ name: string; description: string; pain_points?: string[] }>).map(
              (icp) => (
                <li key={icp.name} className="text-sm border-l-4 border-black pl-3">
                  <p className="font-black uppercase text-black">{icp.name}</p>
                  <p className="font-medium text-neutral-800">{icp.description}</p>
                  {icp.pain_points && icp.pain_points.length > 0 && (
                    <p className="text-xs font-medium text-neutral-600 mt-1">
                      Pain points: {icp.pain_points.join("; ")}
                    </p>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
        {Array.isArray(data.personas) && data.personas.length > 0 && (
          <div className="space-y-2">
            <SectionTitle>Personas</SectionTitle>
            <ul className="space-y-2">
              {(data.personas as Array<{ title: string; goals?: string[] }>).map((persona) => (
                <li key={persona.title} className="text-sm border-l-4 border-black pl-3">
                  <p className="font-black text-black">{persona.title}</p>
                  {persona.goals && persona.goals.length > 0 && (
                    <p className="font-medium text-neutral-800">Goals: {persona.goals.join("; ")}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(data.target_industries) && data.target_industries.length > 0 && (
          <p className="text-sm font-medium text-black">
            <span className="font-black uppercase text-[10px] text-neutral-600">Industries: </span>
            {(data.target_industries as string[]).join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (agent === "market_mapper") {
    return (
      <div className="space-y-4">
        <MarketList
          title="Primary markets"
          markets={(data.primary_markets as MarketSegmentView[]) ?? []}
        />
        <MarketList
          title="Secondary markets"
          markets={(data.secondary_markets as MarketSegmentView[]) ?? []}
        />
        <MarketList
          title="Adjacent markets"
          markets={(data.adjacent_markets as MarketSegmentView[]) ?? []}
        />
      </div>
    );
  }

  if (agent === "signal_hunter" && Array.isArray(data.market_signals)) {
    return (
      <div className="space-y-4">
        <ul className="space-y-3">
          {(
            data.market_signals as Array<{
              signal_type: string;
              urgency: string;
              description: string;
              citations?: Citation[];
            }>
          ).map((signal, index) => (
            <li key={index} className="space-y-2 text-sm">
              <div>
                <span
                  className={cn(
                    "inline-block px-1.5 py-0.5 text-xs mr-2 border-2 border-black font-black uppercase",
                    signal.urgency === "high"
                      ? "bg-red-500 text-white"
                      : signal.urgency === "medium"
                        ? "bg-[#FCD116] text-black"
                        : "bg-white text-black"
                  )}
                >
                  {signal.urgency}
                </span>
                <span className="font-black text-black">{signal.signal_type}</span>
                <p className="font-medium text-neutral-800 mt-0.5">{signal.description}</p>
              </div>
              {signal.citations && signal.citations.length > 0 && (
                <CitationChip citations={signal.citations} />
              )}
            </li>
          ))}
        </ul>
        {Array.isArray(data.intent_indicators) && data.intent_indicators.length > 0 && (
          <div className="space-y-1">
            <SectionTitle>Intent indicators</SectionTitle>
            <ul className="list-disc list-inside text-sm font-medium text-black">
              {(data.intent_indicators as string[]).map((indicator) => (
                <li key={indicator}>{indicator}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (agent === "join_research" && data.merged && typeof data.merged === "object") {
    const merged = data.merged as Record<string, unknown>;
    return (
      <div className="space-y-4">
        <p className="text-sm font-bold text-black">
          Merged market map and buying signals for downstream prospect discovery.
        </p>
        {Boolean(merged.market_map) && (
          <div className="space-y-2">
            <SectionTitle>Market map snapshot</SectionTitle>
            <PayloadTextView data={merged.market_map} />
          </div>
        )}
        {Boolean(merged.signals) && (
          <div className="space-y-2">
            <SectionTitle>Signals snapshot</SectionTitle>
            <PayloadTextView data={merged.signals} />
          </div>
        )}
      </div>
    );
  }

  if (agent === "prospect_discovery" && Array.isArray(data.prospects)) {
    return (
      <ul className="space-y-3">
        {(
          data.prospects as Array<{
            company_name: string;
            fit_score: number;
            industry: string;
            match_rationale?: string;
            citations?: Citation[];
          }>
        ).map((prospect) => (
          <li key={prospect.company_name} className="space-y-2 border-b-2 border-black pb-3">
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-black text-black">{prospect.company_name}</span>
              <span className="font-bold text-neutral-700 shrink-0">
                {prospect.industry} · {prospect.fit_score}% fit
              </span>
            </div>
            {prospect.match_rationale && (
              <p className="text-sm font-medium text-neutral-800">{prospect.match_rationale}</p>
            )}
            {prospect.citations && prospect.citations.length > 0 && (
              <CitationChip citations={prospect.citations} />
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "decision_maker_finder" && Array.isArray(data.decision_makers)) {
    return (
      <ul className="space-y-3">
        {(
          data.decision_makers as Array<{
            company_name: string;
            title: string;
            role: string;
            relevance: string;
            recommended_approach: string;
          }>
        ).map((dm) => (
          <li key={`${dm.company_name}-${dm.title}`} className="text-sm border-l-4 border-black pl-3 space-y-1">
            <p className="font-black text-black">
              {dm.title} · {dm.company_name}
            </p>
            <p className="font-medium text-neutral-800">{dm.relevance}</p>
            <p className="text-xs font-bold text-neutral-600 uppercase">Approach: {dm.recommended_approach}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "opportunity_scorer" && Array.isArray(data.ranked_opportunities)) {
    return (
      <ul className="space-y-3">
        {(
          data.ranked_opportunities as Array<{
            company_name: string;
            overall_score: number;
            priority: string;
            rationale: string;
            fit_score: number;
            intent_score: number;
          }>
        ).map((opp) => (
          <li key={opp.company_name} className="text-sm border-l-4 border-black pl-3 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-black">{opp.company_name}</span>
              <span className="text-[10px] font-black uppercase border-2 border-black px-1.5 py-0.5 bg-[#FCD116]">
                {opp.priority} · {opp.overall_score}/100
              </span>
            </div>
            <p className="font-medium text-neutral-800">{opp.rationale}</p>
            <p className="text-xs font-medium text-neutral-600">
              Fit {opp.fit_score} · Intent {opp.intent_score}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "join_qualify" && data.merged && typeof data.merged === "object") {
    const merged = data.merged as Record<string, unknown>;
    return (
      <div className="space-y-4">
        <p className="text-sm font-bold text-black">
          Merged decision makers and opportunity scores for outreach planning.
        </p>
        {Boolean(merged.decision_makers) && (
          <div className="space-y-2">
            <SectionTitle>Decision makers</SectionTitle>
            <PayloadTextView data={merged.decision_makers} />
          </div>
        )}
        {Boolean(merged.opportunities) && (
          <div className="space-y-2">
            <SectionTitle>Opportunities</SectionTitle>
            <PayloadTextView data={merged.opportunities} />
          </div>
        )}
      </div>
    );
  }

  if (agent === "outreach_planner" && Array.isArray(data.outreach_strategies)) {
    return (
      <ul className="space-y-4">
        {(
          data.outreach_strategies as Array<{
            company_name: string;
            outreach_angle: string;
            why_now?: string;
            why_them?: string;
            email_draft?: string;
            linkedin_draft?: string;
          }>
        ).map((strategy) => (
          <li key={strategy.company_name} className="text-sm border-2 border-black p-3 space-y-2">
            <p className="font-black text-black">{strategy.company_name}</p>
            <p className="font-medium text-neutral-800">{strategy.outreach_angle}</p>
            {strategy.why_now && (
              <p className="text-xs font-medium text-neutral-700">
                <span className="font-black uppercase">Why now: </span>
                {strategy.why_now}
              </p>
            )}
            {strategy.why_them && (
              <p className="text-xs font-medium text-neutral-700">
                <span className="font-black uppercase">Why them: </span>
                {strategy.why_them}
              </p>
            )}
            {strategy.email_draft && (
              <div className="space-y-1">
                <SectionTitle>Email draft</SectionTitle>
                <p className="whitespace-pre-wrap font-medium text-black bg-neutral-50 border border-black p-2">
                  {strategy.email_draft}
                </p>
              </div>
            )}
            {strategy.linkedin_draft && (
              <div className="space-y-1">
                <SectionTitle>LinkedIn draft</SectionTitle>
                <p className="whitespace-pre-wrap font-medium text-black bg-neutral-50 border border-black p-2">
                  {strategy.linkedin_draft}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (agent === "report_assembler") {
    if (typeof data.summary === "string") {
      return (
        <div className="space-y-3">
          <SectionTitle>Executive summary</SectionTitle>
          <p className="text-sm font-medium text-black leading-relaxed">{data.summary}</p>
        </div>
      );
    }
  }

  return <StructuredTextView data={output} />;
}

export function OutputContentView({
  mode,
  agent,
  data,
}: {
  mode: OutputViewMode;
  agent?: AgentName;
  data: unknown;
}) {
  if (data === null || data === undefined) return null;
  if (mode === "json") return <JsonOutputView data={data} />;
  if (agent) return <AgentOutputTextView agent={agent} output={data} />;
  return <PayloadTextView data={data} />;
}
