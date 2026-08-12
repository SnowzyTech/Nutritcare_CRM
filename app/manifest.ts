import type { MetadataRoute } from "next";

/**
 * Web app manifest — served at /manifest.webmanifest.
 *
 * `start_url` is "/", which the root page + proxy resolve to whichever
 * dashboard the signed-in user's role owns (or /login when signed out), so a
 * single installed icon works for every role without per-role builds.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nucle CRM",
    short_name: "Nucle CRM",
    description:
      "Orders, deliveries, inventory and finance for Nucle staff — installable on your phone.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4a0b79",
    lang: "en-NG",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Only routes every authenticated role may open belong here — a shortcut to
    // a role-specific page would just bounce most staff to their own dashboard.
    shortcuts: [
      {
        name: "Chat",
        short_name: "Chat",
        description: "Open team chat",
        url: "/chat",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
