import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/signin"],
        disallow: ["/", "/students", "/calendar", "/report", "/settings", "/bills", "/api/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
