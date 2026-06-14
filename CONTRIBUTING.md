# Contributing

Thanks for exploring GTMaxxin! This repo was built for the Microsoft AI Hack — Agent Swarm track.

## Prerequisites

- Node.js 22+
- pnpm 9+

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Before opening a PR

```bash
pnpm typecheck
MOCK_LLM=true pnpm smoke
```

## Common tasks

### Edit an agent

1. Open `swarm/agents/<name>/prompt.ts` for the system prompt
2. Open `swarm/agents/<name>/node.ts` for logic and tool calls
3. Run `pnpm test-node --agent <agent_id>` to test in isolation
4. Run `pnpm smoke` for full graph validation

See [docs/agents.md](docs/agents.md) for the full agent table.

### Debug with LangGraph Studio

```bash
pnpm langgraph:dev
```

Config: `infra/langgraph.json`. Tracing guide: [docs/langsmith-run.md](docs/langsmith-run.md).

### Change the UI

- Homepage: `app/page.tsx`, `components/home/`
- Live report: `app/report/[runId]/page.tsx`, `components/swarm/`, `components/report/`

## Code conventions

- Match existing patterns in the file you're editing
- Agent IDs use `snake_case`; folders use `kebab-case`
- All agent outputs validated with Zod (`types/gtm.ts`)
- Use `@/` path alias for imports

## Questions

Open an issue on GitHub or try the live demo at [gtmaxxin.app](https://gtmaxxin.app).
