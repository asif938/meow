"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = { slug: string; title: string; image: string; price: string; location: string; kind: string };

/** Auto-advancing image carousel of live listings. Pauses on hover/focus and respects reduced motion. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((n: number) => setIndex((n + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured listings"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-brand-100 shadow-xl ring-1 ring-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <Link
          key={s.slug}
          href={`/listing/${s.slug}`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
          className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            sizes="(max-width: 1024px) 0vw, 560px"
            priority={i === 0}
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-16 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">{s.kind}</p>
            <p className="line-clamp-1 font-display text-lg font-bold">{s.title}</p>
            <p className="mt-0.5 flex items-center gap-3 text-sm">
              <span className="font-semibold">{s.price}</span>
              <span className="inline-flex items-center gap-1 text-white/80">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {s.location}
              </span>
            </p>
          </div>
        </Link>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xl bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xl bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute right-3 top-3 flex gap-1.5" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn("h-2 cursor-pointer rounded-full transition-all", i === index ? "w-6 bg-white" : "w-2 bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
