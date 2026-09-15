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

const compiled = readFileSync(TMP_CSS, "utf8");

// 2a. Tailwind v4 implements border-style, rings, shadows and gradients via
// REGISTERED custom properties (@property --tw-border-style, etc.). @property does
// NOT register when the stylesheet lives inside a Shadow DOM, so those values go
// unset and every border/ring/shadow silently disappears. Fix: pull the @property
// rules out and register them at the DOCUMENT level (global, incl. shadow trees);
// the rest of the CSS stays scoped inside the shadow root.
const PROP_RE = /@property\s+--[\w-]+\s*\{[^}]*\}/g;
const propsCss = (compiled.match(PROP_RE) || []).join("");

// 2b. Variables defined on :root don't apply inside a shadow tree — retarget to :host.
const shadowCss = compiled.replace(PROP_RE, "").replaceAll(":root", ":host");

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
    __EMBED_CSS__: JSON.stringify(shadowCss),
    __EMBED_PROPS__: JSON.stringify(propsCss),
  },
  outfile: "public/embed.js",
  legalComments: "none",
});

rmSync(TMP_CSS, { force: true });
console.log("✓ public/embed.js built");
