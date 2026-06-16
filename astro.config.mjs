// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://valleyseptic.ca",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    build: { target: "es2020" },
  },
  integrations: [
    react(),
    sitemap({
      // Keep noindexed / redirect-only pages out of the sitemap.
      filter: (page) =>
        ![
          "https://valleyseptic.ca/septic-tank-cleaning-abbotsford/",
          "https://valleyseptic.ca/septic-tank-cleaning-langley/",
          "https://valleyseptic.ca/septic-tank-cleaning-mission/",
        ].includes(page),
    }),
  ],
});
