import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  allowedDevOrigins: ["dev.zaker.qzz.io"],
};

export default nextConfig;
