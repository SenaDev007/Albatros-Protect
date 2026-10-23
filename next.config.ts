import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-718aa619-443a-42a2-9974-3bce334a1f0e.space-z.ai", "*.space-z.ai"],
};

export default nextConfig;
