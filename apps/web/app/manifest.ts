import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrendBoard",
    short_name: "TrendBoard",
    id: "/dashboard",
    description:
      "Find live content trends and turn them into hooks, scripts, hashtags, and polished idea cards.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#07111f",
    theme_color: "#07111f",
    categories: ["business", "productivity", "social"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Create Ideas",
        short_name: "Create",
        description: "Open the trend idea dashboard.",
        url: "/dashboard",
      },
      {
        name: "Saved Ideas",
        short_name: "Saved",
        description: "Open saved content ideas.",
        url: "/saved",
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "Open the content calendar.",
        url: "/calendar",
      },
    ],
  };
}
