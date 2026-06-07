/* eslint-disable @typescript-eslint/no-explicit-any */
// Ambient declarations for jspdf / jspdf-autotable.
//
// jspdf 4.x ships its own types, but under "moduleResolution": "bundler" the
// dynamic `await import("jspdf")` calls in lib/analytics-report.ts and
// lib/pdf/invoice-pdf.ts resolve to the minified JS entry, which TypeScript
// treats as implicitly `any` and rejects during `next build`. These minimal
// declarations restore the named/default exports those files rely on.

declare module "jspdf" {
  export class jsPDF {
    constructor(options?: any);
    [key: string]: any;
  }
  export default jsPDF;
}

declare module "jspdf-autotable" {
  const autoTable: (doc: any, options: any) => any;
  export default autoTable;
}
