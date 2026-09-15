/*
 * Builds public/embed.js — the standalone inline-embed bundle (React + the CRM
 * order form). Run by `npm run build:embed`, chained into `npm run build` so
 * Vercel produces it on every deploy.
 *
 * Steps:
 *  1. Compile the form's Tailwind CSS (only classes used in the component).
 *  2. Retarget `:root` → `:host` so the CSS variables resolve inside the Shadow DOM
 *     (`:root` matches the document root, which a shadow tree's <style> can't reach).
 *  3. Bundle embed/entry.ts (React inlined) into one minified IIFE, inlining the CSS.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { build } from "esbuild";

const isWin = process.platform === "win32";
const TMP_CSS = "embed/.embed.compiled.css";

// 1. Compile Tailwind CSS for the form.
execFileSync(
  "npx",
  ["@tailwindcss/cli", "-i", "embed/embed.css", "-o", TMP_CSS, "--minify"],
  { stdio: "inherit", shell: isWin }
);

// 2. Shadow DOM fix: variables defined on :root don't apply inside a shadow tree.
const css = readFileSync(TMP_CSS, "utf8").replaceAll(":root", ":host");

// 3. Bundle the entry + React into a single self-contained script.
await build({
  entryPoints: ["embed/entry.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  jsx: "automatic", // for the JSX inside the imported form component
  tsconfig: "tsconfig.json", // so esbuild resolves the "@/..." path alias
  define: {
    "process.env.NODE_ENV": '"production"',
    __EMBED_CSS__: JSON.stringify(css),
  },
  outfile: "public/embed.js",
  legalComments: "none",
});

rmSync(TMP_CSS, { force: true });
console.log("✓ public/embed.js built");
