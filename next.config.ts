import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: { agentFeedback: true, useTypeScriptCli: false },
};

export default nextConfig;
