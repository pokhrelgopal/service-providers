"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Reusable entrance animation: fades and rises into view the first time it
 * scrolls into the viewport. The reference pattern for motion in this codebase —
 * keep richer, feature-specific animation inside the relevant feature module.
 */
export interface FadeInProps extends HTMLMotionProps<"div"> {
  /** Seconds before the animation starts. */
  delay?: number;
  /** Seconds the animation runs. */
  duration?: number;
  /** Pixels to translate up from on enter. */
  y?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  y = 16,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
