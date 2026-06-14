# Swarm

LangGraph agent pipeline for GTMaxxin GTM intelligence.

## Layout

```
swarm/
  graph.ts              # Entry point — StateGraph wiring
  orchestrator.ts       # Node wrapper, join nodes, output extraction
  state.ts              # GTMReportState + createInitialState
  events.ts             # SSE event types
  agents/<name>/        # Per-agent node.ts + prompt.ts
  shared/               # agent-logger, llm-node, citation-linker, output-validation
  tools/                # tavily, firecrawl, mock
```

## Quick start

```bash
MOCK_LLM=true pnpm smoke                    # full graph
pnpm test-node --agent signal_hunter        # single agent
pnpm langgraph:dev                          # LangGraph Studio
```

See [docs/agents.md](../docs/agents.md) for the full agent reference.
