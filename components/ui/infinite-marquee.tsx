import { cn } from "@/lib/utils";

type InfiniteMarqueeProps = {
  children: React.ReactNode;
  className?: string;
  speed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
};

const speedClass = {
  slow: "animate-marquee-container-slow",
  normal: "animate-marquee-container",
  fast: "animate-marquee-container-fast",
} as const;

export function InfiniteMarquee({
  children,
  className,
  speed = "normal",
  pauseOnHover = true,
}: InfiniteMarqueeProps) {
  return (
    <div className={cn("relative overflow-hidden w-full", className)}>
      <div
        className={cn(
          "flex w-max gap-8",
          speedClass[speed],
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
