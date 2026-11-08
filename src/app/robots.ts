import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/account", "/messages", "/api", "/sell", "/search"] }],
    sitemap: appUrl("/sitemap.xml"),
  };
}
