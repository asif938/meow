"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable dropdown (menu button + popover). Closes on outside click, Esc and
 * when a link inside is activated. `children` can be a render function to
 * access `close()`.
 */
export function Dropdown({
  trigger,
  label,
  children,
  align = "right",
  caret = false,
  triggerClassName,
  panelClassName,
}: {
  trigger: React.ReactNode;
  label: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  caret?: boolean;
  triggerClassName?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        className={cn("inline-flex cursor-pointer items-center gap-1", triggerClassName)}
      >
        {trigger}
        {caret && <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} aria-hidden />}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          onClick={(e) => {
            // Only links close the menu; a <form> submit button must stay mounted until it submits.
            if ((e.target as HTMLElement).closest("a")) close();
          }}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-xl",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export const dropdownItem =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-50 cursor-pointer";
