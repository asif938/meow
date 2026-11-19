"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { updateAvatarAction } from "@/actions/account";
import { uploadToCloudinary } from "@/components/image-uploader";
import { Button } from "@/components/ui";

/** Uploads the photo to Cloudinary (signed, straight from the browser) and saves the URL on the user. */
export function AvatarUploader({ name, avatar, uploadsEnabled }: { name: string; avatar: string | null; uploadsEnabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatar);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const save = (url: string | null) =>
    start(async () => {
      const res = await updateAvatarAction(url);
      if (res?.error) setMessage({ ok: false, text: res.error });
      else {
        setPreview(url);
        setMessage({ ok: true, text: res?.message ?? "Saved." });
      }
    });

  async function onPick(file?: File) {
    if (!file) return;
    setMessage(null);
    if (!file.type.startsWith("image/")) return setMessage({ ok: false, text: "Please choose an image file." });
    if (file.size > 8 * 1024 * 1024) return setMessage({ ok: false, text: "Image must be under 8 MB." });
    start(async () => {
      try {
        const uploaded = await uploadToCloudinary(file, "avatar");
        const res = await updateAvatarAction(uploaded.url);
        if (res?.error) setMessage({ ok: false, text: res.error });
        else {
          setPreview(uploaded.url);
          setMessage({ ok: true, text: res?.message ?? "Saved." });
        }
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Upload failed. Please try again." });
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-display text-2xl font-bold text-brand-700">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your profile photo" className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </span>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Choose profile photo"
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" loading={pending} disabled={!uploadsEnabled} onClick={() => inputRef.current?.click()}>
            <Camera className="h-4 w-4" /> {preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => save(null)}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">
          {uploadsEnabled ? "JPG, PNG or WebP, up to 8 MB." : "Photo upload turns on once Cloudinary is configured on the server."}
        </p>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-emerald-700" : "text-sm text-red-600 dark:text-red-400"}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
