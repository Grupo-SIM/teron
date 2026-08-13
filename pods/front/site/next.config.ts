import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: { root: __dirname },
  allowedDevOrigins: ["dev.zaker.qzz.io"],
};

export default nextConfig;
