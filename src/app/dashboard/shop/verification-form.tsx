"use client";

import { useActionState, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { submitVerificationAction } from "@/actions/seller";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";
import { uploadToCloudinary } from "@/components/image-uploader";

type SellerType = "individual" | "business" | "shelter";

export function VerificationForm({
  uploadsEnabled,
  defaults,
}: {
  uploadsEnabled: boolean;
  defaults: { type: SellerType; shopName: string; bio: string };
}) {
  const [state, action] = useActionState(submitVerificationAction, undefined);
  const [type, setType] = useState<SellerType>(defaults.type);
  const [docUrl, setDocUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (state?.ok) return <FormMessage state={state} />;

  const docLabel = type === "individual" ? "NID photo (front)" : type === "business" ? "Trade license or shop proof" : "Organisation proof";

  return (
    <form action={action} className="space-y-4">
      <Field label="I am a…" htmlFor="v-type">
        <Select id="v-type" name="type" value={type} onChange={(e) => setType(e.target.value as SellerType)}>
          <option value="individual">Individual (selling my cat or used items)</option>
          <option value="business">Business (pet shop / brand)</option>
          <option value="shelter">Shelter or rescuer</option>
        </Select>
      </Field>
      {type !== "individual" && (
        <Field label={type === "business" ? "Shop name" : "Organisation name"} htmlFor="v-shop">
          <Input id="v-shop" name="shopName" defaultValue={defaults.shopName} required />
        </Field>
      )}
      <Field label="About (optional)" htmlFor="v-bio">
        <Textarea id="v-bio" name="bio" defaultValue={defaults.bio} className="min-h-20" />
      </Field>
      <Field label={docLabel} error={uploadError ?? undefined} hint="JPG or PNG, max 8 MB">
        <input type="hidden" name="documentUrl" value={docUrl} />
        {uploadsEnabled ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line p-4 text-sm hover:border-brand-300">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-brand-500" /> : <FileUp className="h-5 w-5 text-brand-500" />}
            <span className="truncate">{docUrl ? "Document uploaded ✓ (click to replace)" : "Choose a file"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) return setUploadError("File must be under 8 MB.");
                setUploading(true);
                setUploadError(null);
                try {
                  setDocUrl((await uploadToCloudinary(file, "verification")).url);
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        ) : (
          <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://res.cloudinary.com/… (uploads not configured)" />
        )}
      </Field>
      <FormMessage state={state} />
      <SubmitButton disabled={!docUrl || uploading} className="w-full sm:w-auto">Submit for review</SubmitButton>
    </form>
  );
}
