import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dg-stats/domain"],
  // Next 16 currently defaults to the experimental CLI checker. Its default
  // cannot parse this monorepo's generated tsconfig in the current runtime;
  // TypeScript's stable compiler API is used instead.
  experimental: {
    useTypeScriptCli: false
  }
};

export default nextConfig;
