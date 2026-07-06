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

function resizeScript(dataNcId: string, origin: string) {
  return `<script>window.addEventListener('message',function(e){if(e.origin!=='${origin}')return;if(e.data&&e.data.type==='nc-resize'){var f=document.querySelector('iframe[data-nc-id="${dataNcId}"]');if(f)f.style.height=e.data.height+'px';}if(e.data&&e.data.type==='nc-redirect'&&e.data.url){window.location.href=e.data.url;}});<\/script>`;
}

function iframeSnippet(dataNcId: string, src: string, origin: string) {
  return `<iframe data-nc-id="${dataNcId}" src="${src}" width="100%" style="border:none; overflow:hidden; min-height:500px; display:block;" frameborder="0" scrolling="no"></iframe>\n${resizeScript(dataNcId, origin)}`;
}

export function buildFormEmbedCodes(formId: string, origin: string) {
  return {
    /** Opt-in form iframe (+ resize/redirect script). */
    optinIframe: iframeSnippet(`${formId}-optin`, `${origin}/order-form/${formId}?tab=optin`, origin),
    /** Order form iframe (+ resize/redirect script). */
    orderIframe: iframeSnippet(`${formId}-order`, `${origin}/order-form/${formId}?tab=order`, origin),
    /** Script-tag embed (no iframe). */
    formCode: `<div data-form-id="${formId}"></div><script src="${origin}/embed.js"></script>`,
  };
}

/** Iframe snippet for a single upsell offer (by index). */
export function buildUpsellEmbedCode(formId: string, origin: string, index: number) {
  return iframeSnippet(
    `${formId}-upsell-${index}`,
    `${origin}/order-form/${formId}?tab=upsell&index=${index}`,
    origin
  );
}
