import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ranker: resolve(__dirname, "ranker/index.html"),
        db: resolve(__dirname, "db/index.html"),
        privacy: resolve(__dirname, "privacy.html"),
        misc: resolve(__dirname, "misc/index.html"),
        skills: resolve(__dirname, "misc/skills/index.html"),
        randomizer: resolve(__dirname, "misc/randomizer/index.html"),
        404: resolve(__dirname, "404.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
