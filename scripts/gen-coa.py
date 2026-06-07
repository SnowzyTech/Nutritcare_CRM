"""Parse docs/nutritcare.xlsx -> modules/finance/data/chart-of-accounts.ts (typed)."""
import zipfile, re, os
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "docs", "nutritcare.xlsx")
OUT = os.path.join(ROOT, "modules", "finance", "data", "chart-of-accounts.ts")
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

z = zipfile.ZipFile(XLSX)
shared = []
sroot = ET.fromstring(z.read("xl/sharedStrings.xml"))
for si in sroot.findall(f"{NS}si"):
    shared.append("".join(t.text or "" for t in si.iter(f"{NS}t")))


def col_letters(ref):
    return "".join(c for c in ref if c.isalpha())


def col_idx(s):
    n = 0
    for c in s:
        n = n * 26 + (ord(c) - 64)
    return n - 1


def read_sheet(fn):
    r = ET.fromstring(z.read(fn))
    rows = []
    for row in r.iter(f"{NS}row"):
        cells = {}
        mx = 0
        for c in row.findall(f"{NS}c"):
            ref = c.get("r"); t = c.get("t")
            v = c.find(f"{NS}v"); isn = c.find(f"{NS}is"); val = ""
            if t == "s" and v is not None:
                val = shared[int(v.text)]
            elif t == "inlineStr" and isn is not None:
                val = "".join(x.text or "" for x in isn.iter(f"{NS}t"))
            elif v is not None:
                val = v.text
            ci = col_idx(col_letters(ref)); cells[ci] = val; mx = max(mx, ci)
        rows.append([cells.get(i, "") for i in range(mx + 1)])
    return rows


def norm(s):
    if s is None:
        return ""
    s = s.replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def norm_fs(s):
    s = norm(s)
    if not s:
        return None
    if "Financial Position" in s:
        return "Statement of Financial Position"
    if "P&L" in s or "Profit or Loss" in s:
        return "Statement of Profit or Loss"
    return s


CLASS_FALLBACK = {
    1: "Assets", 2: "Liabilities", 3: "Equity", 4: "Revenue",
    5: "Cost of Sales", 6: "Operating Expenses",
    7: "Finance Income / Costs", 8: "Taxation",
}
CLASS_LABEL = dict(CLASS_FALLBACK)


def pretty(g):
    if not g:
        return g
    if g != g.upper():  # already mixed/fallback case
        return g
    out = []
    for w in g.split(" "):
        if w in ("&", "/"):
            out.append(w)
            continue
        out.append("-".join(p.capitalize() for p in w.split("-")))
    return " ".join(out)


rows = read_sheet("xl/worksheets/sheet1.xml")
accounts = []
cur_class = None
cur_group = None
started = False
for r in rows:
    c0 = norm(r[0]) if len(r) > 0 else ""
    c1 = norm(r[1]) if len(r) > 1 else ""
    if not started:
        if c0.upper().startswith("A/C CODE"):
            started = True
        continue
    if not c0:
        continue
    m = re.match(r"CLASS\s+(\d+)", c0, re.I)
    if m:
        cur_class = int(m.group(1))
        cur_group = CLASS_FALLBACK[cur_class]
        continue
    if re.fullmatch(r"\d+", c0):
        cls = int(c1) if re.fullmatch(r"\d+", c1 or "") else cur_class
        accounts.append({
            "code": c0,
            "accountClass": cls,
            "group": pretty(cur_group or CLASS_FALLBACK.get(cls, "")),
            "accountName": norm(r[2]) if len(r) > 2 else "",
            "accountType": (norm(r[3]) if len(r) > 3 else "") or None,
            "normalBalance": (norm(r[4]) if len(r) > 4 else "") or None,
            "financialStatement": norm_fs(r[5]) if len(r) > 5 else None,
        })
    else:
        cur_group = c0


def esc(s):
    if s is None:
        return "null"
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


L = []
L.append("// AUTO-GENERATED from docs/nutritcare.xlsx - Nutriticare Chart of Accounts.")
L.append("// Regenerate with: python scripts/gen-coa.py  (do not edit by hand).")
L.append("")
L.append("export interface CoaAccount {")
L.append("  /** Account code, e.g. \"6001\". Unique across the chart. */")
L.append("  code: string;")
L.append("  /** Class number 1-8. */")
L.append("  accountClass: number;")
L.append("  /** Grouping (sub-group header or class name) -> ExpenseCategory. */")
L.append("  group: string;")
L.append("  /** Leaf account name -> ExpenseName. */")
L.append("  accountName: string;")
L.append("  accountType: string | null;")
L.append("  normalBalance: \"Debit\" | \"Credit\" | null;")
L.append("  financialStatement: string | null;")
L.append("}")
L.append("")
L.append("export const CLASS_LABELS: Record<number, string> = {")
for k, v in CLASS_LABEL.items():
    L.append(f"  {k}: {esc(v)},")
L.append("};")
L.append("")
L.append("/** Account classes that represent expenses (Expense Entry form). */")
L.append("export const EXPENSE_CLASSES = [5, 6, 7, 8] as const;")
L.append("")
L.append("export const CHART_OF_ACCOUNTS: CoaAccount[] = [")
for a in accounts:
    L.append(
        "  { code: %s, accountClass: %d, group: %s, accountName: %s, accountType: %s, normalBalance: %s, financialStatement: %s },"
        % (esc(a["code"]), a["accountClass"], esc(a["group"]), esc(a["accountName"]),
           esc(a["accountType"]), esc(a["normalBalance"]), esc(a["financialStatement"]))
    )
L.append("];")
L.append("")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write("\n".join(L))
print("wrote", OUT, "with", len(accounts), "accounts")
