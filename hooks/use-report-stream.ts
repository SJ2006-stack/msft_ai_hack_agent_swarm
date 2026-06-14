"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { AgentLogEvent, AgentStatusEvent } from "@/swarm/events";
import type { AgentOutputs } from "@/server/export/agent-outputs";
import type { AgentStatuses } from "@/types/agents";
import { AGENT_NAMES, createInitialAgentStatuses, type AgentName } from "@/types/agents";
import type { ResearchEvidence } from "@/swarm/state";
import type { GTMInput, GTMReport } from "@/types/gtm";
import { DemoStreamPacer, type DemoStreamItem } from "@/hooks/demo-stream-pacer";

export type TimelineEntry =
  | { kind: "status"; timestamp: string; data: AgentStatusEvent }
  | { kind: "log"; timestamp: string; data: AgentLogEvent };

type RunResearchEvidence = Partial<
  Record<"signal_hunter" | "prospect_discovery", ResearchEvidence>
>;

type RunContextPayload = {
  input?: GTMInput;
  website_content?: string | null;
  research_evidence?: RunResearchEvidence | null;
};

type UseReportStreamOptions = {
  demoHint?: boolean;
};

type UseReportStreamResult = {
  agentStatuses: AgentStatuses;
  agentOutputs: AgentOutputs;
  events: AgentStatusEvent[];
  logs: AgentLogEvent[];
  timeline: TimelineEntry[];
  report: GTMReport | null;
  input: GTMInput | null;
  websiteContent: string | null;
  researchEvidence: RunResearchEvidence | null;
  isComplete: boolean;
  error: string | null;
  langsmithTraceUrl: string | null;
  demoMode: boolean | null;
  selectedAgent: AgentName | null;
  setSelectedAgent: (agent: AgentName) => void;
};

function hydrateRunContext(
  data: RunContextPayload,
  setInput: Dispatch<SetStateAction<GTMInput | null>>,
  setWebsiteContent: Dispatch<SetStateAction<string | null>>,
  setResearchEvidence: Dispatch<SetStateAction<RunResearchEvidence | null>>
): void {
  if (data.input) setInput(data.input);
  if ("website_content" in data) {
    setWebsiteContent(data.website_content ?? null);
  }
  if ("research_evidence" in data) {
    setResearchEvidence(data.research_evidence ?? null);
  }
}

function buildTimeline(
  events: AgentStatusEvent[],
  logs: AgentLogEvent[]
): TimelineEntry[] {
  return [
    ...events.map((data) => ({
      kind: "status" as const,
      timestamp: data.timestamp,
      data,
    })),
    ...logs.map((data) => ({
      kind: "log" as const,
      timestamp: data.timestamp,
      data,
    })),
  ].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function statusKey(event: AgentStatusEvent): string {
  return `${event.timestamp}:${event.agent}:${event.status}:${event.phase}`;
}

function logKey(log: AgentLogEvent): string {
  return `${log.timestamp}:${log.agent}:${log.level}:${log.message}`;
}

function applyStatusEvent(
  event: AgentStatusEvent,
  setAgentStatuses: Dispatch<SetStateAction<AgentStatuses>>,
  setAgentOutputs: Dispatch<SetStateAction<AgentOutputs>>,
  setSelectedAgent: Dispatch<SetStateAction<AgentName | null>>,
  setError: Dispatch<SetStateAction<string | null>>
): void {
  setAgentStatuses((prev) => ({ ...prev, [event.agent]: event.status }));

  if (event.status === "done" && event.output !== undefined) {
    setAgentOutputs((prev) => ({ ...prev, [event.agent]: event.output }));
    setSelectedAgent(event.agent);
  }

  if (event.status === "running") {
    setSelectedAgent(event.agent);
  }

  if (event.status === "error" && event.error) {
    setError(event.error);
  }
}

export function useReportStream(
  runId: string,
  options: UseReportStreamOptions = {}
): UseReportStreamResult {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatuses>(
    createInitialAgentStatuses()
  );
  const [agentOutputs, setAgentOutputs] = useState<AgentOutputs>({});
  const [events, setEvents] = useState<AgentStatusEvent[]>([]);
  const [logs, setLogs] = useState<AgentLogEvent[]>([]);
  const [report, setReport] = useState<GTMReport | null>(null);
  const [input, setInput] = useState<GTMInput | null>(null);
  const [websiteContent, setWebsiteContent] = useState<string | null>(null);
  const [researchEvidence, setResearchEvidence] =
    useState<RunResearchEvidence | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [langsmithTraceUrl, setLangsmithTraceUrl] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean | null>(
    options.demoHint ? true : null
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentName | null>(null);
  const lastUpdateAtRef = useRef(Date.now());
  const isCompleteRef = useRef(false);
  const sourceRef = useRef<EventSource | null>(null);
  const reportReadyRef = useRef(false);
  const demoModeRef = useRef<boolean | null>(options.demoHint ? true : null);
  const pacerRef = useRef<DemoStreamPacer | null>(null);
  const seenStatusKeysRef = useRef(new Set<string>());
  const seenLogKeysRef = useRef(new Set<string>());
  const pendingUntilModeRef = useRef<DemoStreamItem[]>([]);
  const modeResolvedRef = useRef(options.demoHint ?? false);

  const timeline = useMemo(() => buildTimeline(events, logs), [events, logs]);

  const touchTimeline = useCallback(() => {
    lastUpdateAtRef.current = Date.now();
  }, []);

  const applyStreamItem = useCallback(
    (item: DemoStreamItem) => {
      touchTimeline();
      if (item.kind === "status") {
        setEvents((prev) => [...prev, item.data]);
        applyStatusEvent(
          item.data,
          setAgentStatuses,
          setAgentOutputs,
          setSelectedAgent,
          setError
        );
        return;
      }

      setLogs((prev) => [...prev, item.data]);
      if (item.data.level === "error") {
        setSelectedAgent(item.data.agent);
      }
    },
    [touchTimeline]
  );

  const tryMarkComplete = useCallback(() => {
    if (!reportReadyRef.current || isCompleteRef.current) return;
    if (demoModeRef.current && pacerRef.current && !pacerRef.current.isIdle) return;
    isCompleteRef.current = true;
    setIsComplete(true);
  }, []);

  const deliverStreamItem = useCallback(
    (item: DemoStreamItem) => {
      const key =
        item.kind === "status" ? statusKey(item.data) : logKey(item.data);
      const seen =
        item.kind === "status" ? seenStatusKeysRef : seenLogKeysRef;
      if (seen.current.has(key)) return;
      seen.current.add(key);

      if (demoModeRef.current) {
        pacerRef.current?.enqueue(item);
        return;
      }
      applyStreamItem(item);
    },
    [applyStreamItem]
  );

  const resolveDemoMode = useCallback(
    (value: boolean) => {
      if (modeResolvedRef.current && demoModeRef.current === value) return;
      modeResolvedRef.current = true;
      demoModeRef.current = value;
      setDemoMode(value);

      const pending = pendingUntilModeRef.current.splice(0);
      for (const item of pending) {
        deliverStreamItem(item);
      }
    },
    [deliverStreamItem]
  );

  const ingestStreamItem = useCallback(
    (item: DemoStreamItem) => {
      if (!modeResolvedRef.current) {
        pendingUntilModeRef.current.push(item);
        return;
      }
      deliverStreamItem(item);
    },
    [deliverStreamItem]
  );

  useEffect(() => {
    if (options.demoHint) {
      resolveDemoMode(true);
      return;
    }

    const timeout = setTimeout(() => resolveDemoMode(false), 1500);
    return () => clearTimeout(timeout);
  }, [options.demoHint, resolveDemoMode]);

  useEffect(() => {
    pacerRef.current = new DemoStreamPacer(applyStreamItem);
    const unsubscribe = pacerRef.current.onIdle(() => {
      tryMarkComplete();
    });

    return () => {
      unsubscribe();
      pacerRef.current?.dispose();
      pacerRef.current = null;
    };
  }, [applyStreamItem, tryMarkComplete]);

  const fetchReport = useCallback(async () => {
    const res = await fetch(`/api/report/${runId}`);
    if (res.status === 202) {
      const data = await res.json();
      hydrateRunContext(data, setInput, setWebsiteContent, setResearchEvidence);
      if (typeof data.demo_mode === "boolean") resolveDemoMode(data.demo_mode);
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to fetch report");
    }
    const data = await res.json();
    setReport(data.report);
    hydrateRunContext(data, setInput, setWebsiteContent, setResearchEvidence);
    if (!demoModeRef.current) {
      if (data.agent_statuses) setAgentStatuses(data.agent_statuses);
      if (data.agent_outputs) setAgentOutputs(data.agent_outputs);
    }
    if (data.langsmith_trace_url) setLangsmithTraceUrl(data.langsmith_trace_url);
    if (typeof data.demo_mode === "boolean") resolveDemoMode(data.demo_mode);
  }, [runId, resolveDemoMode]);

  const pollRunState = useCallback(async () => {
    const res = await fetch(`/api/report/${runId}`);
    if (res.status === 202) {
      const data = await res.json();
      hydrateRunContext(data, setInput, setWebsiteContent, setResearchEvidence);
      if (typeof data.demo_mode === "boolean") resolveDemoMode(data.demo_mode);

      if (Array.isArray(data.events)) {
        for (const event of data.events as AgentStatusEvent[]) {
          ingestStreamItem({ kind: "status", data: event });
        }
      }
      if (Array.isArray(data.logs)) {
        for (const log of data.logs as AgentLogEvent[]) {
          ingestStreamItem({ kind: "log", data: log });
        }
      }
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to fetch report");
    }
    const data = await res.json();
    setReport(data.report);
    hydrateRunContext(data, setInput, setWebsiteContent, setResearchEvidence);
    if (!demoModeRef.current) {
      if (data.agent_statuses) setAgentStatuses(data.agent_statuses);
      if (data.agent_outputs) setAgentOutputs(data.agent_outputs);
    }
    if (data.langsmith_trace_url) setLangsmithTraceUrl(data.langsmith_trace_url);
    if (typeof data.demo_mode === "boolean") resolveDemoMode(data.demo_mode);

    if (Array.isArray(data.events)) {
      for (const event of data.events as AgentStatusEvent[]) {
        ingestStreamItem({ kind: "status", data: event });
      }
    }
    if (Array.isArray(data.logs)) {
      for (const log of data.logs as AgentLogEvent[]) {
        ingestStreamItem({ kind: "log", data: log });
      }
    }

    reportReadyRef.current = true;
    tryMarkComplete();
    sourceRef.current?.close();
  }, [runId, ingestStreamItem, tryMarkComplete, resolveDemoMode]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    fetch(`/api/report/${runId}`)
      .then(async (res) => {
        if (!res.ok && res.status !== 202) return;
        const data = await res.json();
        if (typeof data.demo_mode === "boolean") resolveDemoMode(data.demo_mode);
        hydrateRunContext(data, setInput, setWebsiteContent, setResearchEvidence);
      })
      .catch(() => undefined);
  }, [runId, resolveDemoMode]);

  useEffect(() => {
    const source = new EventSource(`/api/report/${runId}/stream`);
    sourceRef.current = source;

    source.addEventListener("run_meta", (e) => {
      const data = JSON.parse(e.data) as { demo_mode?: boolean };
      if (data.demo_mode) resolveDemoMode(true);
    });

    source.addEventListener("agent_status", (e) => {
      const event = JSON.parse(e.data) as AgentStatusEvent;
      ingestStreamItem({ kind: "status", data: event });
    });

    source.addEventListener("agent_log", (e) => {
      const log = JSON.parse(e.data) as AgentLogEvent;
      ingestStreamItem({ kind: "log", data: log });
    });

    source.addEventListener("report_ready", () => {
      reportReadyRef.current = true;
      fetchReport()
        .then(() => tryMarkComplete())
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Failed to load report")
        );
      source.close();
    });

    source.addEventListener("error", (e) => {
      if (e instanceof MessageEvent && e.data) {
        const data = JSON.parse(e.data) as { message: string };
        setError(data.message);
      }
    });

    const pollFallback = setInterval(() => {
      if (isCompleteRef.current) return;
      if (Date.now() - lastUpdateAtRef.current < 5000) return;
      pollRunState().catch((err) =>
        setError(err instanceof Error ? err.message : "Poll failed")
      );
    }, 2000);

    return () => {
      clearInterval(pollFallback);
      source.close();
      sourceRef.current = null;
    };
  }, [runId, fetchReport, pollRunState, ingestStreamItem, tryMarkComplete, resolveDemoMode]);

  return {
    agentStatuses,
    agentOutputs,
    events,
    logs,
    timeline,
    report,
    input,
    websiteContent,
    researchEvidence,
    isComplete,
    error,
    langsmithTraceUrl,
    demoMode,
    selectedAgent,
    setSelectedAgent,
  };
}

export { AGENT_NAMES };
