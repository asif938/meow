"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { uploadToCloudinary } from "@/components/image-uploader";
import { createPostAction, updatePostAction } from "@/actions/content";
import { blogPostSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { FormMessage } from "@/components/submit-button";

type Post = { id: string; title: string; excerpt: string; content: string; category: string; coverUrl: string | null; isPublished: boolean };

export function PostForm({ post, uploadsEnabled }: { post?: Post; uploadsEnabled: boolean }) {
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(
    blogPostSchema,
    post ? updatePostAction : createPostAction,
    { transform: (raw) => ({ ...raw, isPublished: raw.isPublished === "on" }) },
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="max-w-3xl space-y-4">
      {post && <input type="hidden" name="id" value={post.id} />}
      <Field label="Title" htmlFor="f-title" error={errors.title}>
        <Input {...fieldProps("title")} defaultValue={post?.title} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="f-category" error={errors.category}>
          <Input {...fieldProps("category")} defaultValue={post?.category ?? "Cat care"} required />
        </Field>
        <Field
          label="Cover image"
          htmlFor="f-coverUrl"
          error={errors.coverUrl ?? uploadError ?? undefined}
          hint={uploadsEnabled ? "Upload an image to Cloudinary, or paste its URL." : "Uploads turn on once Cloudinary is configured. You can paste a Cloudinary or Unsplash URL meanwhile."}
        >
          <div className="flex gap-2">
            <Input {...fieldProps("coverUrl")} ref={coverRef} defaultValue={post?.coverUrl ?? ""} type="url" />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Choose cover image"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                setUploadError(null);
                try {
                  const img = await uploadToCloudinary(file, "blog");
                  if (coverRef.current) coverRef.current.value = img.url;
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setUploading(false);
                }
              }}
            />
            <Button type="button" variant="outline" loading={uploading} disabled={!uploadsEnabled} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload
            </Button>
          </div>
        </Field>
      </div>
      <Field label="Excerpt" htmlFor="f-excerpt" error={errors.excerpt} hint="Shown on cards and in search results (20–300 characters).">
        <Textarea {...fieldProps("excerpt")} defaultValue={post?.excerpt} className="min-h-20" required />
      </Field>
      <Field
        label="Content"
        htmlFor="f-content"
        error={errors.content}
        hint="Separate paragraphs with a blank line. Start a line with “## ” for a sub-heading, or “- ” for bullet points."
      >
        <Textarea {...fieldProps("content")} defaultValue={post?.content} className="min-h-72 font-mono text-[13px]" required />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? true} className="h-4 w-4 accent-brand-600" />
        Published (visible on the public blog)
      </label>
      <FormMessage state={state} />
      <Button type="submit" loading={pending}>{pending ? "Saving…" : post ? "Save changes" : "Publish post"}</Button>
    </form>
  );
}
