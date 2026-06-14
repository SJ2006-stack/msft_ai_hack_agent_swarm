import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { KVNamespace } from "@cloudflare/workers-types";
import { GTMInputSchema } from "@/types/gtm";
import { runSwarmGraph } from "@/swarm/graph";
import { runDemoReplay } from "@/swarm/demo-runner";
import { resolveDemoCompany } from "@/fixtures/demo-companies";
import { syncEnvFromCloudflare } from "@/server/cloudflare-env";
import { createRun, updateRun, appendEvent, appendLog, bindRunsKV } from "@/server/runs/store";
import type { SwarmStreamEvent } from "@/swarm/events";

export const maxDuration = 300;

function extractRunsKV(env: unknown): KVNamespace | null {
  const kv = (env as Record<string, unknown>).RUNS_KV;
  if (kv && typeof kv === "object" && "get" in kv && "put" in kv) {
    return kv as KVNamespace;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = GTMInputSchema.parse(body);
    const runId = randomUUID();

    let ctx: { waitUntil: (p: Promise<unknown>) => void } | undefined;
    try {
      const cf = await getCloudflareContext({ async: true });
      ctx = cf.ctx;
      syncEnvFromCloudflare(cf.env);
      bindRunsKV(extractRunsKV(cf.env));
    } catch {
      bindRunsKV(null);
    }

    const demoCompany = resolveDemoCompany(input);

    await createRun(runId);
    await updateRun(runId, { status: "running", demo_mode: demoCompany !== null });

    const pendingEvents: Promise<void>[] = [];

    const emit = async (event: SwarmStreamEvent) => {
      const pending =
        event.type === "status"
          ? appendEvent(runId, event.data)
          : appendLog(runId, event.data);
      pendingEvents.push(pending);
      await pending;
    };

    const execute = demoCompany
      ? runDemoReplay(runId, demoCompany, emit)
      : runSwarmGraph(runId, input, emit);

    const runPromise = execute
      .then(async (finalState) => {
        await Promise.all(pendingEvents);
        await updateRun(runId, {
          status: "done",
          state: finalState,
        });
      })
      .catch(async (err) => {
        await Promise.all(pendingEvents);
        await updateRun(runId, {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      });

    if (ctx?.waitUntil) {
      ctx.waitUntil(runPromise);
    } else {
      void runPromise;
    }

    return NextResponse.json({
      run_id: runId,
      demo_mode: demoCompany !== null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
