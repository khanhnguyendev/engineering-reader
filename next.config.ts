import type { NextConfig } from "next";
import { readRedirects, toNextRedirects } from "./lib/content/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return toNextRedirects(readRedirects());
  },
};

export default nextConfig;
