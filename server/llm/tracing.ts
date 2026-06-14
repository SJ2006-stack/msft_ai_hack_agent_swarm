export function getLangSmithTraceUrl(runId: string): string | undefined {
  if (process.env.LANGCHAIN_TRACING_V2 !== "true") return undefined;
  const project = process.env.LANGCHAIN_PROJECT ?? "gtmaxxin";
  return `https://smith.langchain.com/o/default/projects/p/${project}?search=${runId}`;
}
