export const DEMO_REPLAY_LINE_DELAY_MS = 600;

export function demoReplayDelay(ms = DEMO_REPLAY_LINE_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
