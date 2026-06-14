import { logAgent } from "@/swarm/shared/agent-logger";
import type { SearchResult } from "@/swarm/tools/tavily";
import type { AgentName } from "@/types/agents";
import {
  CitationSchema,
  SignalHunterOutputSchema,
  ProspectDiscoveryOutputSchema,
  BuyingSignalParseSchema,
  SignalHunterParseSchema,
  ProspectParseSchema,
  ProspectDiscoveryParseSchema,
  type Citation,
} from "@/types/gtm";
import type { z } from "zod";

const WEAK_MATCH_THRESHOLD = 2;
const MAX_CITATIONS = 2;
const SNIPPET_MAX = 200;

type BuyingSignalDraft = z.infer<typeof BuyingSignalParseSchema>;
type SignalHunterDraft = z.infer<typeof SignalHunterParseSchema>;
type ProspectDraft = z.infer<typeof ProspectParseSchema>;
type ProspectDiscoveryDraft = z.infer<typeof ProspectDiscoveryParseSchema>;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function extractDomain(url: string | undefined): string {
  if (!url) return "";
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function makeSnippet(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= SNIPPET_MAX) return trimmed;
  return `${trimmed.slice(0, SNIPPET_MAX).trim()}…`;
}

function resultToCitation(result: SearchResult): Citation {
  return CitationSchema.parse({
    url: result.url,
    title: result.title,
    snippet: makeSnippet(result.content),
  });
}

function scoreResult(
  itemText: string,
  result: SearchResult,
  extraKeywords: string[] = []
): number {
  const itemTokens = tokenize(itemText);
  const resultText = `${result.title} ${result.content} ${result.url}`.toLowerCase();
  let score = 0;

  for (const token of itemTokens) {
    if (resultText.includes(token)) score++;
  }

  for (const kw of extraKeywords) {
    const keyword = kw.toLowerCase().trim();
    if (!keyword) continue;
    if (resultText.includes(keyword)) score += 3;
    const domain = extractDomain(keyword);
    if (domain && result.url.includes(domain)) score += 5;
  }

  return score;
}

function selectCitations(
  itemText: string,
  searchResults: SearchResult[],
  sourceIds: number[] | undefined,
  extraKeywords: string[],
  agent: AgentName,
  itemLabel: string
): Citation[] {
  if (searchResults.length === 0) {
    logAgent(agent, "warn", `No search results to cite for ${itemLabel}`);
    throw new Error(`Cannot link citations for ${itemLabel}: no search results`);
  }

  if (sourceIds?.length) {
    const fromIds = sourceIds
      .map((id) => searchResults[id - 1])
      .filter((r): r is SearchResult => Boolean(r))
      .slice(0, MAX_CITATIONS)
      .map(resultToCitation);
    if (fromIds.length > 0) return fromIds;
    logAgent(
      agent,
      "warn",
      `Invalid source_ids for ${itemLabel} — falling back to keyword match`
    );
  }

  const ranked = searchResults
    .map((result, index) => ({
      result,
      index,
      score: scoreResult(itemText, result, extraKeywords),
    }))
    .sort((a, b) => b.score - a.score);

  const matches = ranked.filter((entry) => entry.score > 0).slice(0, MAX_CITATIONS);

  if (matches.length === 0) {
    logAgent(
      agent,
      "warn",
      `Weak citation match for ${itemLabel} — using top search result as fallback`
    );
    return [resultToCitation(searchResults[0])];
  }

  if (matches[0].score < WEAK_MATCH_THRESHOLD) {
    logAgent(
      agent,
      "warn",
      `Weak citation match for ${itemLabel} (score ${matches[0].score})`
    );
  }

  return matches.map((entry) => resultToCitation(entry.result));
}

function linkItemCitations<T extends { citations?: Citation[]; source_ids?: number[] }>(
  item: T,
  itemText: string,
  extraKeywords: string[],
  searchResults: SearchResult[],
  agent: AgentName,
  itemLabel: string
): T & { citations: Citation[]; source_ids?: undefined } {
  const citations =
    item.citations && item.citations.length > 0
      ? item.citations.map((c) => CitationSchema.parse(c))
      : selectCitations(
          itemText,
          searchResults,
          item.source_ids,
          extraKeywords,
          agent,
          itemLabel
        );

  const { source_ids: _sourceIds, ...rest } = item;
  return { ...rest, citations } as T & {
    citations: Citation[];
    source_ids?: undefined;
  };
}

export function linkBuyingSignalCitations(
  draft: SignalHunterDraft,
  searchResults: SearchResult[],
  agent: AgentName = "signal_hunter"
): z.infer<typeof SignalHunterOutputSchema> {
  const market_signals = draft.market_signals.map((signal, index) => {
    const itemText = `${signal.signal_type} ${signal.description} ${signal.source ?? ""}`;
    const linked = linkItemCitations(
      signal,
      itemText,
      [signal.signal_type],
      searchResults,
      agent,
      `signal #${index + 1} (${signal.signal_type})`
    );
    return linked;
  });

  return SignalHunterOutputSchema.parse({
    market_signals,
    intent_indicators: draft.intent_indicators,
  });
}

export function linkProspectCitations(
  draft: ProspectDiscoveryDraft,
  searchResults: SearchResult[],
  agent: AgentName = "prospect_discovery"
): z.infer<typeof ProspectDiscoveryOutputSchema> {
  const prospects = draft.prospects.map((prospect, index) => {
    const itemText = `${prospect.company_name} ${prospect.industry} ${prospect.match_rationale} ${prospect.icp_match}`;
    const domain = extractDomain(prospect.website);
    const linked = linkItemCitations(
      prospect,
      itemText,
      [prospect.company_name, domain, prospect.industry],
      searchResults,
      agent,
      `prospect #${index + 1} (${prospect.company_name})`
    );
    return linked;
  });

  return ProspectDiscoveryOutputSchema.parse({ prospects });
}
