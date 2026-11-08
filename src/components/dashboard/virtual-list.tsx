"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Generic windowed list. Only the rows inside the scroll viewport (+ `overscan`) are mounted,
 * so 5,000 rows cost about the same DOM as 15. Row heights are measured, so wrapping text on
 * mobile does not break alignment.
 */
export function VirtualList<T>({
  items,
  getKey,
  estimateSize,
  renderRow,
  overscan = 6,
  gap = 12,
  className,
  onScroll,
  label,
  scrollRef,
}: {
  items: T[];
  getKey: (item: T) => string;
  estimateSize: number;
  renderRow: (item: T) => React.ReactNode;
  overscan?: number;
  gap?: number;
  className?: string;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  label: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const own = useRef<HTMLDivElement>(null);
  const parentRef = scrollRef ?? own;
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
    getItemKey: (i) => getKey(items[i]),
  });

  return (
    <div ref={parentRef} onScroll={onScroll} className={className} role="list" aria-label={label} tabIndex={0}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((v) => (
          <div
            key={v.key}
            role="listitem"
            data-index={v.index}
            ref={virtualizer.measureElement}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${v.start}px)` }}
          >
            {renderRow(items[v.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
