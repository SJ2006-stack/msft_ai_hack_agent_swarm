# Agents

Each agent lives in `swarm/agents/<folder>/` with:

- `node.ts` — LangGraph node function (`run<AgentName>`)
- `prompt.ts` — system prompt for the LLM

Graph wiring is in `swarm/graph.ts`. Join nodes (`join_research`, `join_qualify`) are handled in `swarm/orchestrator.ts`.

## Agent reference

| Agent ID | Folder | Phase | Tools | Output |
|----------|--------|-------|-------|--------|
| `input_processor` | `input-processor/` | 0 | Firecrawl (optional) | Normalized input + website content |
| `gtm_strategist` | `gtm-strategist/` | 1 | — | ICPs, personas, value prop |
| `market_mapper` | `market-mapper/` | 2 | — | Market segments |
| `signal_hunter` | `signal-hunter/` | 2 | Tavily | Buying signals + citations |
| `join_research` | *(orchestrator)* | 2 | — | Sync parallel research |
| `prospect_discovery` | `prospect-discovery/` | 3 | Tavily | Qualified prospects |
| `decision_maker_finder` | `decision-maker-finder/` | 4 | — | Stakeholder targets |
| `opportunity_scorer` | `opportunity-scorer/` | 4 | — | Ranked opportunities |
| `join_qualify` | *(orchestrator)* | 4 | — | Sync qualification branches |
| `outreach_planner` | `outreach-planner/` | 5 | — | Email + LinkedIn drafts |
| `report_assembler` | `report-assembler/` | 5 | — | Executive summary + final report |

## Testing a single agent

```bash
MOCK_LLM=true pnpm test-node --agent gtm_strategist
```

Available agents: all rows above except `join_research` and `join_qualify`.

## Adding a new agent

1. Create `swarm/agents/<kebab-name>/node.ts` and `prompt.ts`
2. Register the node in `swarm/graph.ts`
3. Add the agent ID to `types/agents.ts` (`AGENT_NAMES`, labels, phases)
4. Extend `swarm/state.ts` if new state fields are needed
5. Add output extraction in `server/export/agent-outputs.ts`
6. Update UI graph positions in `components/swarm/agent-flow-graph.tsx`
7. Run `pnpm smoke`

## Mock / fixture data

When `MOCK_LLM=true`, agents use slices from `fixtures/demo-slices.ts` instead of calling OpenRouter. Golden input is in `fixtures/demo-input.ts`.
