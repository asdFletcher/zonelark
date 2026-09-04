import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Absolute path to zone-lark — prevents Turbopack from using ~/package-lock.json as workspace root
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "node:sqlite"],
  devIndicators: false,
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
