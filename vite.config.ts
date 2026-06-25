import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/family-chores-pwa-mvp";

export default defineConfig({
  base: isGithubPages ? `${repoBasePath}/` : "/",
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
});
