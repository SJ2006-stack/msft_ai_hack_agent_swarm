"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { fadeIn, fadeUp, springSnappy } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
};

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
} as const;

export function ScrollReveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: ScrollRevealProps) {
  const Component = motionTags[Tag];

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -8% 0px", amount: 0.12 }}
      variants={fadeUp}
      transition={{ ...springSnappy, delay: delay / 1000 }}
    >
      {children}
    </Component>
  );
}

type MotionDivProps = HTMLMotionProps<"div">;

export function MotionFade({
  children,
  className,
  delay = 0,
  ...props
}: MotionDivProps & { delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ ...springSnappy, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
