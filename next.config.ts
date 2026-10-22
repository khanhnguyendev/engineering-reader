import path from "node:path";
import type { NextConfig } from "next";
import { readRedirects } from "./lib/content/read-redirects";
import { toNextRedirects } from "./lib/content/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return toNextRedirects(readRedirects(path.join(path.dirname(process.env.CONTENT_ROOT ?? "content/posts"), "redirects.json")));
  },
};

export default nextConfig;
