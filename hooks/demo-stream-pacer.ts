import type { AgentLogEvent, AgentStatusEvent } from "@/swarm/events";
import { DEMO_REPLAY_LINE_DELAY_MS } from "@/lib/demo-replay-pacing";

export type DemoStreamItem =
  | { kind: "status"; data: AgentStatusEvent }
  | { kind: "log"; data: AgentLogEvent };

type IdleListener = () => void;

export class DemoStreamPacer {
  private queue: DemoStreamItem[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private idleListeners = new Set<IdleListener>();

  constructor(
    private readonly onItem: (item: DemoStreamItem) => void,
    private readonly lineDelayMs = DEMO_REPLAY_LINE_DELAY_MS
  ) {}

  get isIdle(): boolean {
    return this.queue.length === 0 && this.timer === null;
  }

  onIdle(listener: IdleListener): () => void {
    this.idleListeners.add(listener);
    return () => this.idleListeners.delete(listener);
  }

  enqueue(item: DemoStreamItem): void {
    this.queue.push(item);
    this.schedule();
  }

  enqueueMany(items: DemoStreamItem[]): void {
    if (items.length === 0) return;
    this.queue.push(...items);
    this.schedule();
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.queue = [];
    this.idleListeners.clear();
  }

  private schedule(): void {
    if (this.timer) return;
    this.drainNext();
  }

  private drainNext(): void {
    const next = this.queue.shift();
    if (!next) {
      this.timer = null;
      for (const listener of this.idleListeners) listener();
      return;
    }

    this.onItem(next);
    this.timer = setTimeout(() => this.drainNext(), this.lineDelayMs);
  }
}
