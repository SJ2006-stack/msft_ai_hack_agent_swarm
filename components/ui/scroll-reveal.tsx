"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return createElement(Tag, {
    ref,
    className: cn("animate-on-scroll", isVisible && "is-visible", className),
    style: { transitionDelay: `${delay}ms` },
    children,
  });
}
