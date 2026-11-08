"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Returns a stable debounced wrapper around `fn`.
 * The timer lives in a ref (mutating it must never trigger a render) and the latest `fn`
 * is kept in a ref too, so the returned function identity never changes.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 250) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), delay);
    },
    [delay],
  );
}

/** Debounced mirror of a value (useful for derived/filtered data). */
export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Tracks whether a scroll container is scrolled past `threshold`.
 * Scroll events fire dozens of times per frame, so work is coalesced with requestAnimationFrame
 * and React state only changes when the boolean flips (not on every scroll event).
 */
export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false);
  const frame = useRef(0);
  const last = useRef(false);
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      if (frame.current) return; // a frame is already scheduled
      const el = e.currentTarget;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const next = el.scrollTop > threshold;
        if (next !== last.current) {
          last.current = next;
          setPast(next);
        }
      });
    },
    [threshold],
  );
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return [past, onScroll] as const;
}

/* ------------------------------------------------------------------ */
/* Tiny external store: per-id selection with selective subscriptions. */
/* ------------------------------------------------------------------ */

export type SelectionStore = ReturnType<typeof createSelectionStore>;

export function createSelectionStore() {
  let selected = new Set<string>();
  let version = 0;
  const all = new Set<() => void>();
  const byId = new Map<string, Set<() => void>>();

  const notify = (ids: Iterable<string>) => {
    version++;
    for (const id of ids) byId.get(id)?.forEach((l) => l());
    all.forEach((l) => l());
  };

  return {
    has: (id: string) => selected.has(id),
    size: () => selected.size,
    version: () => version,
    ids: () => selected,
    toggle(id: string) {
      selected = new Set(selected);
      if (!selected.delete(id)) selected.add(id);
      notify([id]);
    },
    set(ids: string[]) {
      const touched = new Set([...selected, ...ids]);
      selected = new Set(ids);
      notify(touched);
    },
    clear() {
      const touched = [...selected];
      selected = new Set();
      notify(touched);
    },
    subscribeId(id: string, l: () => void) {
      let s = byId.get(id);
      if (!s) byId.set(id, (s = new Set()));
      s.add(l);
      return () => {
        s!.delete(l);
        if (s!.size === 0) byId.delete(id);
      };
    },
    subscribeAll(l: () => void) {
      all.add(l);
      return () => all.delete(l);
    },
  };
}

/** Re-renders ONLY when this id's selected flag flips. */
export function useIsSelected(store: SelectionStore, id: string) {
  return useSyncExternalStore(
    (l) => store.subscribeId(id, l),
    () => store.has(id),
    () => false,
  );
}

/** Re-renders when the number of selected rows changes. */
export function useSelectionCount(store: SelectionStore) {
  return useSyncExternalStore(store.subscribeAll, store.size, () => 0);
}
