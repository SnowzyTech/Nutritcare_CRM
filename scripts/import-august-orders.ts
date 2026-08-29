/**
 * scripts/import-august-orders.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-OFF: import the 24–29 Aug 2026 order tracker (docs/Nucle_August_Orders.xlsx)
 * as real orders in the live system. See the approved plan:
 *   ~/.claude/plans/examine-this-excel-sheet-agile-pizza.md
 *
 * Behaviour (owner-approved):
 *   • Imports 99 of 106 real rows — SKIPS every "Duplicate order" / "TESTING" row.
 *   • Status: Delivered/Reorder Delivered→DELIVERED (Reorder also isReorder),
 *             Confirmed→CONFIRMED, everything else→PENDING.
 *   • Money comes straight from the sheet Amount (lineTotal/netAmount). Multi-product
 *     rows split the amount PROPORTIONAL to each product's DB sellingPrice × qty.
 *   • Customer find-or-create by phone (blank phone → new customer, matched by name).
 *   • Rows with no CS rep → assigned to sales-manager Blessing Ehijie + note "[needs rep]".
 *   • NO WhatsApp, NO stock changes, NO Delivery/ledger rows. Writes wrapped in
 *     withoutCameraAudit() so the audit log stays clean. Re-runnable (idempotent via
 *     a per-row "[imp:aug2026:<hash>]" marker in Order.notes).
 *
 * SAFE BY DEFAULT — no flags → READ-ONLY dry-run. Writes only when BOTH:
 *     --commit                    (CLI flag)
 *     IMPORT_ACK=I_UNDERSTAND     (env var)
 *
 * Usage (default DNS on this PC SERVFAILs on neon.tech — the shim below fixes it):
 *   node --env-file=.env --import tsx scripts/import-august-orders.ts            # dry-run
 *   IMPORT_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/import-august-orders.ts --commit
 */

// ── DNS shim: this machine's default resolver SERVFAILs on the neon.tech zone,
//    so Node/Prisma fail with EAI_AGAIN. Route lookups through Google DNS. Must be
//    installed before the Neon pool opens a connection (i.e. before the first query).
import dns from "node:dns";
{
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "8.8.4.4"]);
  const orig = dns.lookup.bind(dns);
  // @ts-expect-error — override the overloaded lookup with a resolve4-backed one.
  dns.lookup = (hostname: string, options: unknown, cb?: unknown) => {
    let opts = options as { all?: boolean } | ((...a: unknown[]) => void);
    let callback = cb as ((...a: unknown[]) => void) | undefined;
    if (typeof options === "function") {
      callback = options as (...a: unknown[]) => void;
      opts = {};
    }
    const all = !!(opts as { all?: boolean }).all;
    resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length) {
        if (all) return callback!(null, addrs.map((a) => ({ address: a, family: 4 })));
        return callback!(null, addrs[0], 4);
      }
      return (orig as (...a: unknown[]) => void)(hostname, opts, callback);
    });
  };
}

import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";
import { nextOrderNumber } from "@/modules/orders/services/order-number.service";

// ─────────────────────────────────────────────────────────────────────────────
// Config
const XLSX_PATH = path.join(process.cwd(), "docs", "Nucle_August_Orders.xlsx");
const IMPORT_TAG = "imp:aug2026";
const COMMIT = process.argv.includes("--commit");
const ACK = process.env.IMPORT_ACK === "I_UNDERSTAND";

// Sheet product name (normalised) → DB product sku.
const PRODUCT_SKU: Record<string, string> = {
  neurovivebalm: "NEUR-LY6B9",
  nivelmortea: "NIVE-J7439",
  elmanaspices: "ELMA-LEUUR",
  prosxactpack: "KLIN-MN3AG",
  trimtonetea: "TRIM-MFHP4",
};

// CS-rep mapping: `sheet` = keyword to detect in the sheet's "CS IN CHARGE" cell;
// `db` = substring that uniquely identifies the DB user (sales roles only). They
// differ where the sheet and DB spell a name differently (YUSUF vs "Yussuf").
const REP_DEFS: { sheet: string; db: string }[] = [
  { sheet: "tosin", db: "tosin" },
  { sheet: "yusuf", db: "yussuf" },
  { sheet: "sarah", db: "sarah" },
  { sheet: "joy", db: "joy" },
  { sheet: "marvellous", db: "marvellous" },
  { sheet: "blessing", db: "blessing" },
  { sheet: "elizabeth", db: "elizabeth" },
  { sheet: "pauline", db: "pauline" },
  { sheet: "deborah", db: "deborah" },
  { sheet: "chinaza", db: "chinaza" },
  { sheet: "vivian", db: "vivian" },
  { sheet: "esther", db: "esther" },
];
const FALLBACK_REP_SHEET_KW = "blessing"; // Blessing Ehijie (sales manager)

// Sheet delivery-agent label (normalised) → DB Agent.companyName (matched normalised).
const AGENT_MAP: Record<string, string> = {
  "mr ola": "OLAMO2 LOGISTICS(Mr Ola)",
  "gilgal abuja": "GilGal Logistics ( Abuja)",
  "e-crown ph": "Ecrownz Logistics",
  "edo state delivery nhc": "ATOMIC LOGISTICS AND COURIER SERVICES  (EDO ATOMIC)",
  "mr joe abuja": "GOODLUCK LOGISTICS AND DELIVERY SERVICES(Mr Joe Abuja)",
  "nhc/calabar orders": "First-Class Logistics (NHC Calabar)",
  "atomic delta": "ATOMIC LOGISTICS AND COURIER SERVICES, ASABA",
  "company umuahia deli": "Nhc Umuahia",
  "d2d ikorodu lagos": "D2D Logistics services (Ikorodu)",
  "e-bolt bayelsa": "eBolt Logistics",
  "fomax ph": "Fomax logistics PH",
  "kenex akwa-ibom": "Kenex logistics",
  "lagos island": "Charleson",
  "nhc owerri": "Claver logistics(Nhc Owerri)",
  "plateau orders w/isaac": "Techcellx Logistics ( Isaac Plateau)",
  "reality courier": "REALITY COURIERS SERVICE",
  "smart warri": "smart logistics (Smart Warri)",
  "anambra orders /w timothy": "Pelican delivery and logistic services(Anambra Timothy)",
  "aximo lagos": "XIMO LOGISTICS",
  "god's own logistics": "Gods Own Logistics",
  "harry enugu": "Harryson logistics(Enugu)",
  "i.c logics. benue": "IC services Ltd (Benue)",
  "mr joe kaduna": "OK EXPRESS AND LOGISTICS (Mr Joe Kaduna)",
  "mr joe kano": "SilverSlate Logistics and Delivery services(Nhc Kano)",
  "ogun nhc": "Always on top logistics(OgunNhc)",
  "osun nhc": "Okikijesu logistics",
  "ph county logistics": "Country Motors and Logistics Limited.(PH Country)",
  "pope anambra": "Arizz express Deliveries ( Pope  Anambra",
  "sokoto,zamfara /w timi": "TSK Logistic Enterprise (Sokoto/Zamfara Timi)",
  "trinity logistics": "Trinity Logistics",
  "trust jona abeokuta": "Trust Jona Logistics",
  "yusuf kwara": "YTEE Express ( Yusuf kwara)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const normProd = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const round2 = (n: number) => Math.round(n * 100) / 100;

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&");
}

/** Minimal .xlsx reader: parse the ZIP central directory, inflate each entry. */
function readZipEntries(file: string): Map<string, Buffer> {
  const buf = readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("xlsx: End Of Central Directory not found");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("xlsx: bad central-dir signature");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    out.set(name, method === 0 ? Buffer.from(comp) : inflateRawSync(comp));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function colIndex(ref: string): number {
  const letters = (ref.match(/^[A-Z]+/) ?? [""])[0];
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

/** Parse the first worksheet into a 2-D array of trimmed strings. */
function readSheet(file: string): string[][] {
  const entries = readZipEntries(file);
  const ssXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const shared: string[] = [];
  for (const si of ssXml.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    const parts = (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []).map((t) =>
      decodeXml(t.replace(/^<t[^>]*>/, "").replace(/<\/t>$/, ""))
    );
    shared.push(parts.join(""));
  }
  const sheetXml = entries.get("xl/worksheets/sheet1.xml")?.toString("utf8") ?? "";
  const rows: string[][] = [];
  for (const rowXml of sheetXml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) ?? []) {
    const cells: string[] = [];
    const re = /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rowXml))) {
      const attrs = m[1];
      const body = m[2];
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) ?? [])[1];
      if (!ref) continue;
      const t = (attrs.match(/t="([^"]+)"/) ?? [])[1];
      let val = "";
      if (body) {
        if (t === "s") {
          const v = (body.match(/<v>([\s\S]*?)<\/v>/) ?? [])[1];
          val = v != null ? (shared[parseInt(v, 10)] ?? "") : "";
        } else if (t === "inlineStr") {
          val = decodeXml((body.match(/<t[^>]*>([\s\S]*?)<\/t>/) ?? ["", ""])[1]);
        } else {
          const v = (body.match(/<v>([\s\S]*?)<\/v>/) ?? [])[1];
          val = v != null ? decodeXml(v) : "";
        }
      }
      cells[colIndex(ref)] = val.trim();
    }
    rows.push(cells);
  }
  return rows;
}

function serialToDate(serial: number): Date {
  // Excel epoch 1899-12-30; anchor at 11:00 UTC (= 12:00 WAT) to avoid day drift.
  return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000 + 11 * 3_600_000);
}

type Status = "DELIVERED" | "CONFIRMED" | "PENDING" | "SKIP";
function mapStatus(raw: string): { status: Status; isReorder: boolean } {
  const s = raw.trim().toLowerCase();
  if (s === "duplicate order" || s === "testing") return { status: "SKIP", isReorder: false };
  if (s === "delivered") return { status: "DELIVERED", isReorder: false };
  if (s === "reorder delivered") return { status: "DELIVERED", isReorder: true };
  if (s === "confirmed") return { status: "CONFIRMED", isReorder: false };
  return { status: "PENDING", isReorder: false }; // not confirmed / not attended / blank
}

// ─────────────────────────────────────────────────────────────────────────────
type ItemPlan = { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number; costPriceAtSale: number };
type OrderPlan = {
  rowNo: number;
  hash: string;
  client: string;
  phone: string;
  email: string;
  whatsapp: string;
  state: string;
  date: Date;
  status: Exclude<Status, "SKIP">;
  isReorder: boolean;
  salesRepId: string;
  salesRepName: string;
  agentId: string | null;
  agentName: string | null;
  needsRep: boolean;
  sheetNote: string;
  totalAmount: number;
  mainProductName: string;
  items: ItemPlan[];
};

function dbHost(): string {
  try { return new URL(process.env.DATABASE_URL ?? "").host; } catch { return "unknown"; }
}

async function main() {
  const bar = "═".repeat(78);
  console.log(bar);
  console.log("  NUCLE CRM — import August (24–29 Aug 2026) orders");
  console.log(bar);
  console.log(`  DB host : ${dbHost()}`);
  console.log(`  Source  : ${XLSX_PATH}`);
  console.log(`  Mode    : ${COMMIT && ACK ? "LIVE (writing)" : "DRY-RUN (no writes)"}`);
  console.log("─".repeat(78));

  // ── Resolve DB mappings (self-validating) ──────────────────────────────────
  const errors: string[] = [];

  const skus = [...new Set(Object.values(PRODUCT_SKU))];
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    select: { id: true, name: true, sku: true, sellingPrice: true, costPrice: true },
  });
  const productBySku = new Map(products.map((p) => [p.sku, p]));
  for (const sku of skus) if (!productBySku.has(sku)) errors.push(`Product sku not found: ${sku}`);

  const salesUsers = await prisma.user.findMany({
    where: { role: { in: ["SALES_REP", "SALES_REP_MANAGER"] } },
    select: { id: true, name: true },
  });
  const repBySheetKw = new Map<string, { id: string; name: string }>();
  for (const def of REP_DEFS) {
    const hits = salesUsers.filter((u) => u.name.toLowerCase().includes(def.db));
    if (hits.length !== 1) { errors.push(`Rep "${def.sheet}" (db match "${def.db}") matched ${hits.length} sales users`); continue; }
    repBySheetKw.set(def.sheet, hits[0]);
  }
  const fallbackRep = repBySheetKw.get(FALLBACK_REP_SHEET_KW) ?? null;
  if (!fallbackRep) errors.push(`Fallback rep "${FALLBACK_REP_SHEET_KW}" not resolved`);

  const agents = await prisma.agent.findMany({
    where: { deletedAt: null },
    select: { id: true, companyName: true },
  });
  const agentByNorm = new Map<string, { id: string; companyName: string }>();
  for (const a of agents) {
    const k = norm(a.companyName);
    if (!agentByNorm.has(k)) agentByNorm.set(k, a); // first live wins
  }
  const agentIdByLabel = new Map<string, { id: string; companyName: string }>();
  for (const [label, target] of Object.entries(AGENT_MAP)) {
    const hit = agentByNorm.get(norm(target));
    if (!hit) { errors.push(`Agent not found for "${label}" → "${target}"`); continue; }
    agentIdByLabel.set(label, hit);
  }

  if (errors.length) {
    console.log("MAPPING ERRORS — fix before importing:");
    for (const e of errors) console.log("   ✗ " + e);
    console.log(bar);
    return;
  }
  console.log(`Mappings OK: ${products.length} products, ${repBySheetKw.size} reps, ${agentIdByLabel.size} agents.`);

  // ── Parse the sheet ────────────────────────────────────────────────────────
  const rows = readSheet(XLSX_PATH);
  const data = rows.slice(1); // drop header
  const C = { date: 0, client: 1, email: 2, state: 3, phone: 4, phone2: 5, products: 6, qty: 7, amount: 8, agent: 9, cs: 10, status: 11, note: 14 };
  const get = (r: string[], i: number) => (r[i] ?? "").trim();

  const plans: OrderPlan[] = [];
  const rowIssues: string[] = [];
  let skippedTestDup = 0;
  let nonOrderRows = 0;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const rowNo = i + 2; // 1-based incl header
    const productsRaw = get(r, C.products);
    const amountRaw = get(r, C.amount);
    if (!productsRaw && !amountRaw) { nonOrderRows++; continue; }

    const { status, isReorder } = mapStatus(get(r, C.status));
    if (status === "SKIP") { skippedTestDup++; continue; }

    // Products / quantities (comma-separated for multi-product rows).
    const names = productsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const qtys = get(r, C.qty).split(",").map((s) => parseInt(s.trim(), 10));
    const amount = Math.round(parseFloat(amountRaw.replace(/[^0-9.]/g, "")) || 0);
    if (!names.length) { rowIssues.push(`row ${rowNo}: no product`); continue; }
    if (names.length !== qtys.length || qtys.some((q) => !Number.isFinite(q) || q <= 0)) {
      rowIssues.push(`row ${rowNo}: product/qty count mismatch ("${productsRaw}" / "${get(r, C.qty)}")`); continue;
    }
    if (amount <= 0) { rowIssues.push(`row ${rowNo}: bad amount "${amountRaw}"`); continue; }

    const resolved = names.map((nm) => productBySku.get(PRODUCT_SKU[normProd(nm)] ?? ""));
    const missing = names.filter((_, k) => !resolved[k]);
    if (missing.length) { rowIssues.push(`row ${rowNo}: unknown product(s) ${missing.join(", ")}`); continue; }

    // Split the amount across lines, weighted by sellingPrice × qty (D-1).
    const weights = resolved.map((p, k) => Number(p!.sellingPrice) * qtys[k]);
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const items: ItemPlan[] = [];
    let allocated = 0;
    for (let k = 0; k < resolved.length; k++) {
      const p = resolved[k]!;
      const lineTotal = k === resolved.length - 1 ? amount - allocated : Math.round(amount * weights[k] / wSum);
      allocated += lineTotal;
      items.push({
        productId: p.id, name: p.name, quantity: qtys[k],
        unitPrice: round2(lineTotal / qtys[k]), lineTotal,
        costPriceAtSale: Number(p.costPrice),
      });
    }

    // Sales rep.
    const csRaw = get(r, C.cs);
    const csKw = REP_DEFS.find((d) => csRaw.toLowerCase().includes(d.sheet))?.sheet;
    const rep = csKw ? repBySheetKw.get(csKw)! : fallbackRep!;
    const needsRep = !csKw;

    // Delivery agent (optional).
    const agentLabel = get(r, C.agent);
    let agentId: string | null = null;
    let agentName: string | null = null;
    if (agentLabel) {
      const hit = agentIdByLabel.get(norm(agentLabel));
      if (!hit) { rowIssues.push(`row ${rowNo}: unknown agent "${agentLabel}"`); continue; }
      agentId = hit.id; agentName = hit.companyName;
    }

    const serial = parseInt(get(r, C.date), 10);
    const date = Number.isFinite(serial) ? serialToDate(serial) : new Date("2026-08-24T11:00:00Z");
    const phone = get(r, C.phone).replace(/\s+/g, "");
    const client = get(r, C.client) || "(no name)";
    const naturalKey = [get(r, C.date), client.toLowerCase(), phone, amount, productsRaw, get(r, C.qty)].join("|");
    const hash = createHash("sha1").update(naturalKey).digest("hex").slice(0, 10);

    plans.push({
      rowNo, hash, client, phone, email: get(r, C.email), whatsapp: get(r, C.phone2).replace(/\s+/g, ""),
      state: get(r, C.state), date, status, isReorder,
      salesRepId: rep.id, salesRepName: rep.name, agentId, agentName, needsRep,
      sheetNote: get(r, C.note), totalAmount: amount, mainProductName: items[0].name, items,
    });
  }

  // ── Dry-run summary ────────────────────────────────────────────────────────
  const tally = (key: (p: OrderPlan) => string) => {
    const m = new Map<string, number>();
    for (const p of plans) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  console.log("─".repeat(78));
  console.log(`Rows: ${data.length} total · ${nonOrderRows} blank · ${skippedTestDup} skipped (Duplicate/TESTING) · ${plans.length} to import`);
  console.log(`Grand total amount: ₦${plans.reduce((n, p) => n + p.totalAmount, 0).toLocaleString()}`);
  console.log("By status:  " + tally((p) => p.status).map(([k, n]) => `${k}=${n}`).join("  "));
  console.log("No-rep rows → Blessing (flagged [needs rep]): " + plans.filter((p) => p.needsRep).length);
  console.log("No-phone rows: " + plans.filter((p) => !p.phone).length + " · multi-product rows: " + plans.filter((p) => p.items.length > 1).length);
  console.log("\nBy sales rep:");
  for (const [k, n] of tally((p) => p.salesRepName)) console.log(`   ${String(n).padStart(3)}  ${k}`);
  console.log("\nBy delivery agent:");
  for (const [k, n] of tally((p) => p.agentName ?? "(none)")) console.log(`   ${String(n).padStart(3)}  ${k}`);
  if (rowIssues.length) {
    console.log("\n⚠ ROW ISSUES (skipped — resolve if unexpected):");
    for (const e of rowIssues) console.log("   " + e);
  }
  console.log("\nSample (first 3 + multi-product rows):");
  const sample = [...plans.slice(0, 3), ...plans.filter((p) => p.items.length > 1)];
  for (const p of sample) {
    console.log(`   row ${p.rowNo} ${p.date.toISOString().slice(0, 10)} ${p.status.padEnd(9)} ${p.client.slice(0, 22).padEnd(22)} ₦${p.totalAmount.toLocaleString().padEnd(9)} rep=${p.salesRepName.split(" ")[0]} agent=${p.agentName ?? "-"}`);
    for (const it of p.items) console.log(`        · ${it.name.slice(0, 30).padEnd(30)} x${it.quantity} @₦${it.unitPrice} = ₦${it.lineTotal.toLocaleString()}`);
  }
  console.log(bar);

  // ── Gate ───────────────────────────────────────────────────────────────────
  if (!(COMMIT && ACK)) {
    console.log("DRY RUN — nothing written.");
    if (COMMIT && !ACK) console.log("  (--commit given but IMPORT_ACK=I_UNDERSTAND not set.)");
    console.log("  To import: IMPORT_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/import-august-orders.ts --commit");
    return;
  }

  // ── Live import ────────────────────────────────────────────────────────────
  console.log("IMPORTING…");
  let created = 0, skippedExisting = 0;
  await withoutCameraAudit(async () => {
    // Idempotency: which hashes are already imported?
    const existing = await prisma.order.findMany({
      where: { notes: { contains: `[${IMPORT_TAG}:` } },
      select: { notes: true },
    });
    const done = new Set<string>();
    for (const o of existing) {
      const m = o.notes?.match(new RegExp(`\\[${IMPORT_TAG}:([0-9a-f]{10})\\]`));
      if (m) done.add(m[1]);
    }

    const customerByPhone = new Map<string, string>();
    for (const p of plans) {
      if (done.has(p.hash)) { skippedExisting++; continue; }

      // Customer: find-or-create by phone (fresh customer when no phone).
      let customerId: string | undefined;
      if (p.phone) {
        customerId = customerByPhone.get(p.phone);
        if (!customerId) {
          const found = await prisma.customer.findFirst({ where: { phone: p.phone, deletedAt: null }, select: { id: true } });
          customerId = found?.id;
        }
      }
      if (!customerId) {
        const c = await prisma.customer.create({
          data: {
            name: p.client, phone: p.phone, whatsappNumber: p.whatsapp || null,
            email: p.email || null, deliveryAddress: "", state: p.state || "", lga: "",
          },
          select: { id: true },
        });
        customerId = c.id;
      }
      if (p.phone) customerByPhone.set(p.phone, customerId);

      const notes = [
        `[${IMPORT_TAG}:${p.hash}]`,
        p.needsRep ? "[needs rep]" : "",
        p.sheetNote,
      ].filter(Boolean).join(" ");

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const orderNumber = await nextOrderNumber(tx, p.mainProductName);
        await tx.order.create({
          data: {
            orderNumber,
            customerId: customerId!,
            salesRepId: p.salesRepId,
            status: p.status,
            isReorder: p.isReorder,
            totalAmount: p.totalAmount,
            netAmount: p.totalAmount,
            deliveryFee: 0,
            date: p.date,
            createdAt: p.date,
            notes,
            ...(p.agentId ? { agentId: p.agentId } : {}),
            items: {
              create: p.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                lineTotal: it.lineTotal,
                costPriceAtSale: it.costPriceAtSale,
              })),
            },
          },
        });
      });
      created++;
      if (created % 20 === 0) console.log(`   …${created} created`);
    }
  });

  // ── Verify ─────────────────────────────────────────────────────────────────
  const total = await prisma.order.count();
  const tagged = await prisma.order.count({ where: { notes: { contains: `[${IMPORT_TAG}:` } } });
  console.log("─".repeat(78));
  console.log(`DONE. created=${created}  skipped(existing)=${skippedExisting}`);
  console.log(`Orders in DB now: ${total}  (tagged ${IMPORT_TAG}: ${tagged})`);
  console.log(bar);
}

main()
  .catch((e) => { console.error("Import failed:", e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
