"use client";

import Image from "next/image";
import { useState } from "react";
import { Cat, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function cld(url: string, t: string) {
  return url.includes("res.cloudinary.com") ? url.replace("/upload/", `/upload/${t}/`) : url;
}

export function Gallery({ images, title, videoUrl }: { images: string[]; title: string; videoUrl?: string | null }) {
  const [i, setI] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-card)] bg-brand-50 text-brand-300">
        <Cat className="h-20 w-20" />
      </div>
    );
  }

  const go = (d: number) => setI((prev) => (prev + d + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-stone-100"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        <Image
          src={cld(images[i], "f_auto,q_auto,w_1200")}
          alt={`${title} — photo ${i + 1} of ${images.length}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 shadow"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 shadow"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
              {i + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {images.map((src, idx) => (
          <button
            key={src + idx}
            onClick={() => setI(idx)}
            aria-label={`Show photo ${idx + 1}`}
            aria-current={idx === i}
            className={cn(
              "relative h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 ring-transparent",
              idx === i && "ring-brand-500",
            )}
          >
            <Image src={cld(src, "f_auto,q_auto,c_fill,w_160,h_128")} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-ink text-xs text-white"
          >
            <PlayCircle className="h-6 w-6" />
            Video
          </a>
        )}
      </div>
    </div>
  );
}
