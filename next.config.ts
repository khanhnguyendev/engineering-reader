import path from "node:path";
import type { NextConfig } from "next";
import { readRedirects } from "./lib/content/read-redirects";
import { toNextRedirects } from "./lib/content/redirects";

const nextConfig: NextConfig = {
  // beforeFiles so the rewrite is matched before the filesystem and dynamic routes.
  async rewrites() {
    return { beforeFiles: [{ source: "/:locale(vi|en)/posts/:file([a-z0-9-]+\\.md)", destination: "/:locale/md/:file" }] };
  },
  async redirects() {
    return toNextRedirects(readRedirects(path.join(path.dirname(process.env.CONTENT_ROOT ?? "content/posts"), "redirects.json")));
  },
};

export default nextConfig;
