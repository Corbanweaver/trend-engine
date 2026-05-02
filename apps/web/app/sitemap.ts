import type { MetadataRoute } from "next";

const BASE_URL = "https://www.contentideamaker.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    "",
    "/pricing",
    "/trending",
    "/login",
    "/signup",
    "/support",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/trending" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
