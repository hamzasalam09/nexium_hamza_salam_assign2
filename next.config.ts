import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No need to explicitly set NEXT_PUBLIC_ variables in env config
  // as they are automatically exposed to the browser
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
