import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return [
    { url: `${appUrl}/signin`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
  ];
}
