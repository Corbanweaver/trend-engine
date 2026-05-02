import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/profile", "/saved", "/calendar", "/analytics"],
    },
    sitemap: "https://www.contentideamaker.com/sitemap.xml",
  };
}
