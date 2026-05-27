import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrendBoard",
    short_name: "TrendBoard",
    id: "/analyze",
    description:
      "Analyze creator trends and turn them into source-backed organic video idea cards.",
    start_url: "/analyze",
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
        name: "Analyze Trends",
        short_name: "Analyze",
        description: "Run trend analysis and generate organic video idea cards.",
        url: "/analyze",
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
