import { cn } from "@/lib/utils";

type MeshGradientProps = {
  className?: string;
  variant?: "hero" | "dark";
};

export function MeshGradient({ className, variant = "hero" }: MeshGradientProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        variant === "dark" && "opacity-80",
        className
      )}
      aria-hidden
    >
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      {variant === "hero" && <div className="mesh-blob mesh-blob-4" />}
    </div>
  );
}
