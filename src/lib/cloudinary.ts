import "server-only";
import crypto from "node:crypto";

export const cloudinaryEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

/** Signs upload params for a direct browser → Cloudinary upload. */
export function signUpload(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    timestamp,
    signature,
  };
}

/** Insert a Cloudinary transformation for resized delivery. */
export function cldTransform(url: string, transform = "f_auto,q_auto,w_800") {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}
