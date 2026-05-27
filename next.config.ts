import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client is a server-only package with native/non-JS files
  // (e.g. hrana-client LICENSE). Keep it external so the bundler doesn't
  // try to parse its internals.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
