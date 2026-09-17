import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** The archive is committed, so its last commit is the site's data date. */
const getLastDataUpdate = () => {
  try {
    const date = execSync("git log -1 --format=%cI -- data/fireworks.json", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return date || null;
  } catch {
    return null;
  }
};

export default defineConfig({
  define: {
    __DATA_LAST_UPDATED__: JSON.stringify(getLastDataUpdate()),
  },
  plugins: [react({ compiler: true })],
  // maplibre's worker is a module and imports a sibling chunk of its own.
  worker: { format: "es" },
});
