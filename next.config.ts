import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "postgres", "bcryptjs"],
  devIndicators: false,
  // Next walks parent directories for a lockfile and will otherwise treat
  // ~/package-lock.json as the workspace root.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
