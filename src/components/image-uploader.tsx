"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Star, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId?: string | null; hash?: string | null };

type Signature = { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };

export async function uploadToCloudinary(file: File, purpose: "listing" | "verification" = "listing"): Promise<UploadedImage> {
  const sigRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });
  if (!sigRes.ok) throw new Error((await sigRes.json().catch(() => ({})))?.error ?? "Upload not available");
  const sig = (await sigRes.json()) as Signature;

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("Upload failed");
  const data = (await res.json()) as { secure_url: string; public_id: string; etag?: string };
  return { url: data.secure_url, publicId: data.public_id, hash: data.etag ?? null };
}

export function ImageUploader({
  value,
  onChange,
  max,
  uploadsEnabled,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max: number;
  uploadsEnabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    const tooBig = list.find((f) => f.size > 8 * 1024 * 1024);
    if (tooBig) {
      setError("Each photo must be under 8 MB.");
      return;
    }
    setBusy(list.length);
    const results: UploadedImage[] = [];
    for (const file of list) {
      try {
        results.push(await uploadToCloudinary(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...results]);
  }

  function move(i: number, to: number) {
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.url + i} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">Cover</span>
            ) : (
              <button
                type="button"
                onClick={() => move(i, 0)}
                className="absolute left-1.5 top-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/90 text-ink"
                aria-label="Make cover photo"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/90 text-red-600"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy-${i}`} className="grid aspect-square place-items-center rounded-xl bg-stone-100">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ))}
        {uploadsEnabled && value.length + busy < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 text-sm font-medium text-brand-700 hover:border-brand-400"
          >
            <ImagePlus className="h-6 w-6" />
            Add photos
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {!uploadsEnabled && value.length < max && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted">
            Photo uploads aren&apos;t configured yet (Cloudinary). Paste an image URL from res.cloudinary.com or images.unsplash.com instead.
          </p>
          <div className="flex gap-2">
            <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" aria-label="Image URL" />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                if (!/^https:\/\//.test(urlInput)) return setError("Enter a valid https URL");
                onChange([...value, { url: urlInput.trim() }]);
                setUrlInput("");
                setError(null);
              }}
            >
              <Link2 className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      )}
      <p className={cn("text-xs", error ? "text-red-600" : "text-muted")}>
        {error ?? `${value.length}/${max} photos · The first photo is the cover. Clear, well-lit photos sell faster.`}
      </p>
    </div>
  );
}
