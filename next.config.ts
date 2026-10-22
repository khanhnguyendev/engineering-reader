import path from "node:path";
import type { NextConfig } from "next";
import { readRedirects } from "./lib/content/read-redirects";
import { toNextRedirects } from "./lib/content/redirects";

const nextConfig: NextConfig = {
  // beforeFiles: the page route (dynamicParams = false) would otherwise 404 on `x.md` first.
  async rewrites() {
    return { beforeFiles: [{ source: "/:locale(vi|en)/posts/:file([a-z0-9-]+\\.md)", destination: "/:locale/md/:file" }] };
  },
  async redirects() {
    return toNextRedirects(readRedirects(path.join(path.dirname(process.env.CONTENT_ROOT ?? "content/posts"), "redirects.json")));
  },
};

export default nextConfig;
