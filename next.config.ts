import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (experimental) was turned on during development, but a
  // production build (not `next dev`, where this never showed up) leaks a
  // mid-render redirect() as a raw RSC digest in the response body instead of
  // a real HTTP 307 on routes with no static content to show a logged-out
  // visitor. That breaks the homepage for every signed-out request, which is
  // worse than losing the experimental performance feature. See
  // docs/DECISIONS.md.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
