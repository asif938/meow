/** Image hosts allowed for listing photos (must match next.config remotePatterns). */
export const IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

export function isAllowedImageUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
