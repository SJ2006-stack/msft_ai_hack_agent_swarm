# Documentation

Start here if you're exploring the repo beyond the main [README](../README.md).

| Doc | Audience | Contents |
|-----|----------|----------|
| [architecture.md](./architecture.md) | Everyone | Swarm topology, data flow, persistence |
| [agents.md](./agents.md) | Agent authors | All 11 agents — files, inputs, outputs |
| [langsmith-run.md](./langsmith-run.md) | Debugging | LangSmith tracing + golden fixture runs |
| [deployment-cloudflare.md](./deployment-cloudflare.md) | Deployers | Worker setup, secrets, CI |

## Quick paths

- **Run the demo** → [README Quick Start](../README.md#quick-start-judges--organizers)
- **Edit an agent** → `swarm/agents/<name>/node.ts` + `prompt.ts`
- **Smoke test** → `MOCK_LLM=true pnpm smoke`
- **LangGraph Studio** → `pnpm langgraph:dev`
