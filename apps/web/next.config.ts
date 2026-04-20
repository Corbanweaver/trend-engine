import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Monorepo: trace files from the repository root so serverless bundles resolve
 * correctly when the Vercel "Root Directory" is `apps/web`.
 * Do not set a custom "Output Directory" in the Vercel dashboard for Next.js.
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

export default nextConfig;
