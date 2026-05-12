import type { MetadataRoute } from "next";

import { allSeoPages } from "@/lib/seo-content";

const BASE_URL = "https://www.contentideamaker.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const corePaths = [
    "",
    "/pricing",
    "/about",
    "/trending",
    "/niches",
    "/support",
    "/privacy",
    "/terms",
  ];
  const seoPaths = allSeoPages.map((page) => page.path);

  return [...corePaths, ...seoPaths].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency:
      path === "" || path === "/trending"
        ? "daily"
        : seoPaths.includes(path)
          ? "weekly"
          : "monthly",
    priority: path === "" ? 1 : seoPaths.includes(path) ? 0.8 : 0.7,
  }));
}
