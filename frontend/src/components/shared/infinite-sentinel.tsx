"use client";

import { useEffect, useRef } from "react";

/** Invisible marker that fires `onReach` when scrolled near the viewport —
 * drives "load more" for cursor-paginated lists. Disabled (no observer) while
 * there's nothing more to load or a fetch is already in flight. */
export function InfiniteSentinel({
  onReach,
  disabled = false,
}: {
  onReach: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReach();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, onReach]);

  return <div ref={ref} aria-hidden className="h-1 w-full" />;
}
