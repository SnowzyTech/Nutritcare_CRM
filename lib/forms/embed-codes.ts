/**
 * Single source of truth for the embed snippets a form can be pasted onto a
 * landing page with. Used by BOTH the admin forms list and the media-buyer
 * forms list so the copied code is always identical.
 *
 * The iframe snippets include a companion `<script>` that listens for the
 * `postMessage` events the embedded order form emits:
 *  - `nc-resize`   → auto-adjusts the iframe height to fit the form content
 *  - `nc-redirect` → navigates the host page to the thank-you / sales page
 * Omitting this script leaves the iframe stuck at `min-height` and breaks the
 * post-order redirect, so it must ship with every iframe snippet.
 */

function resizeScript(formId: string, origin: string, suffix: "optin" | "order") {
  return `<script>window.addEventListener('message',function(e){if(e.origin!=='${origin}')return;if(e.data&&e.data.type==='nc-resize'){var f=document.querySelector('iframe[data-nc-id="${formId}-${suffix}"]');if(f)f.style.height=e.data.height+'px';}if(e.data&&e.data.type==='nc-redirect'&&e.data.url){window.location.href=e.data.url;}});<\/script>`;
}

function iframeSnippet(formId: string, origin: string, suffix: "optin" | "order") {
  const tab = suffix; // ?tab=optin | ?tab=order
  return `<iframe data-nc-id="${formId}-${suffix}" src="${origin}/order-form/${formId}?tab=${tab}" width="100%" style="border:none; overflow:hidden; min-height:500px; display:block;" frameborder="0" scrolling="no"></iframe>\n${resizeScript(formId, origin, suffix)}`;
}

export function buildFormEmbedCodes(formId: string, origin: string) {
  return {
    /** Opt-in form iframe (+ resize/redirect script). */
    optinIframe: iframeSnippet(formId, origin, "optin"),
    /** Order form iframe (+ resize/redirect script). */
    orderIframe: iframeSnippet(formId, origin, "order"),
    /** Script-tag embed (no iframe). */
    formCode: `<div data-form-id="${formId}"></div><script src="${origin}/embed.js"></script>`,
  };
}
