import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/booking/", "/preview"] }],
    sitemap: `${resolveSiteUrl()}/sitemap.xml`,
  };
}
