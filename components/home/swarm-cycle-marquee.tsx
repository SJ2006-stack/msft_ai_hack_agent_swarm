import { InfiniteMarquee } from "@/components/ui/infinite-marquee";

const CYCLE_ITEMS = [
  "REFINE ICP",
  "SCAN SIGNALS",
  "MAP MARKETS",
  "QUALIFY ACCOUNTS",
  "SCORE OPPORTUNITIES",
  "DRAFT OUTREACH",
  "COMPILE REPORT",
  "ADAPT & ITERATE",
] as const;

export function SwarmCycleMarquee() {
  return (
    <div className="border-y-4 border-black bg-[#0A0A0A] py-3 overflow-hidden">
      <InfiniteMarquee speed="fast" className="text-[#FCD116]">
        <div className="flex items-center gap-6 px-4">
          {CYCLE_ITEMS.map((item) => (
            <span
              key={item}
              className="flex items-center gap-6 text-xs sm:text-sm font-black uppercase tracking-widest whitespace-nowrap"
            >
              {item}
              <span className="text-white/40 text-lg" aria-hidden>
                →
              </span>
            </span>
          ))}
        </div>
      </InfiniteMarquee>
    </div>
  );
}
