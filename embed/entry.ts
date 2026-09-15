/*
 * Inline embed entry — bundled to public/embed.js by scripts/build-embed.mjs.
 *
 * Pasted on a WordPress/Elementor landing page as:
 *   <div data-form-id="..."></div>
 *   <script src="https://crm.mynucle.com/embed.js" async></script>
 *
 * For each placeholder it mounts the CRM's own order form directly into the page
 * (inside a Shadow DOM for style isolation) — no iframe. Order submission, failure
 * logging, and the thank-you redirect all run in-page via the existing CRM APIs.
 */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import OrderFormClient from "@/app/order-form/[id]/order-form-client";
import type { SavedForm } from "@/lib/formsStore";

// Compiled Tailwind CSS for the form, inlined at build time (esbuild `define`).
declare const __EMBED_CSS__: string;
// Tailwind v4 @property rules — must be registered at DOCUMENT level (they don't
// register from inside a shadow root), or borders/rings/shadows won't render.
declare const __EMBED_PROPS__: string;

// Capture the CRM origin from THIS script's own <src> synchronously at load —
// document.currentScript is null once we're inside async callbacks.
const CRM_ORIGIN: string = (() => {
  const src = (document.currentScript as HTMLScriptElement | null)?.src;
  try {
    return src ? new URL(src).origin : window.location.origin;
  } catch {
    return window.location.origin;
  }
})();

type PublicForm = {
  id: string;
  name: string;
  hits: number;
  orders: number;
  data: Record<string, unknown>;
  createdAt: string;
  disabledAt: string | null;
};

/**
 * Register Tailwind's @property custom-property defaults once, at the document
 * level. @property is ignored inside a shadow root, so without this the
 * --tw-border-style / --tw-ring-* / --tw-shadow-* values stay unset and borders,
 * focus rings and shadows silently vanish inside the embedded form. Registered
 * properties are global and inherit into shadow trees, and are otherwise inert.
 */
function ensureGlobalProps() {
  const id = "nucle-embed-props";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = __EMBED_PROPS__;
  document.head.appendChild(style);
}

/** Load Poppins once (fonts must resolve at document level to reach the shadow tree). */
function ensureFont() {
  const id = "nucle-embed-font";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

async function mount(host: HTMLElement) {
  if (host.getAttribute("data-nc-mounted") === "1") return; // guard double-mount
  const formId = host.getAttribute("data-form-id");
  if (!formId) return;
  host.setAttribute("data-nc-mounted", "1");

  // Sealed style bubble: the WordPress theme can't leak into the form, or vice-versa.
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = __EMBED_CSS__;
  shadow.appendChild(style);
  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  try {
    const res = await fetch(`${CRM_ORIGIN}/api/forms/${formId}`, { credentials: "omit" });
    if (!res.ok) throw new Error(`config HTTP ${res.status}`);
    const form = (await res.json()) as PublicForm;
    const initialForm: SavedForm = {
      id: form.id,
      formName: form.name,
      createdAt: form.createdAt,
      hits: form.hits,
      orders: form.orders,
      data: form.data,
    };
    createRoot(mountPoint).render(
      createElement(OrderFormClient, { formId, initialForm, apiBase: CRM_ORIGIN })
    );
  } catch (err) {
    mountPoint.innerHTML =
      '<p style="font-family:system-ui,sans-serif;padding:16px;text-align:center;color:#374151">' +
      "Sorry, the order form could not load. Please refresh the page.</p>";
    console.error("[nucle-embed] failed to load form", err);
  }
}

function init() {
  ensureGlobalProps();
  ensureFont();
  document.querySelectorAll<HTMLElement>("div[data-form-id]").forEach((el) => {
    void mount(el);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
