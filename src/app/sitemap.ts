import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/book`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/find`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
