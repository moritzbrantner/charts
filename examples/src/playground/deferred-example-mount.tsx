import { useEffect, useRef, useState } from "react";

import { ChartPanel } from "@moritzbrantner/charts";

import type { ReactNode } from "react";

export function DeferredExampleMount({
  children,
  className = "grid gap-4",
  testId,
  title,
}: {
  children: ReactNode;
  className?: string;
  testId: string;
  title: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const node = rootRef.current;

    if (!node || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={rootRef}>
      {isVisible ? (
        children
      ) : (
        <section className={className} data-testid={testId} style={{ minHeight: "24rem" }}>
          <ChartPanel title={title} description="This example mounts when it enters the viewport.">
            <div className="h-48 rounded-md border border-dashed border-border/80 bg-muted/20" />
          </ChartPanel>
        </section>
      )}
    </div>
  );
}
