#!/usr/bin/env python3
"""Parse Morgan Hill Matrix + UNIT PLANS PDF -> mh-matrix-drawings.json + per-page PDF extracts."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent.parent
BOX = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/25048 - Carrollton, TX - Morgan Hill/PROJECT MANAGING/SHOP DRAWINGS"
)
PDF = BOX / "DRAWING SET" / "UNIT PLANS_5.2025.pdf"
XLSX = BOX / "Morgan Hill Matrix NEW.xlsx"
OUT_JSON = ROOT / ".firecrawl" / "mh-matrix-drawings.json"
OUT_PAGES = ROOT / ".firecrawl" / "mh-unit-plan-pages"
CABINET_GAP = {"MW04.5", "MW05", "MW06"}

UNIT_PAT = re.compile(
    r"UNIT\s+([AB]\d+\.\d+[A-Z])(?:\s+ANSI(?:\s*TYPE)?\s*A|\s+ANSIA)?\s+(?:FLOOR\s+)?PLAN",
    re.I,
)


def matrix_name(base: str, span: str) -> str:
    if re.search(r"ANSIA", span, re.I):
        return f"{base} ANSIA"
    if re.search(r"ANSI", span, re.I):
        return f"{base} ANSI A"
    return base


def mode(lst: list[str]) -> str | None:
    return Counter(lst).most_common(1)[0][0] if lst else None


def canonical_kitchen(codes: list[str]) -> tuple[str | None, str | None]:
    if not codes:
        return None, None
    for raw, _ in Counter(codes).most_common():
        mw = mw_base(raw)
        if mw and mw not in CABINET_GAP:
            return raw, mw
    raw = Counter(codes).most_common(1)[0][0]
    return raw, mw_base(raw)


def mw_base(s: str | None) -> str | None:
    if not s:
        return None
    m = re.match(r"(MW[\d.]+)", s)
    return m.group(1) if m else None


def parse_vanity(s: str | None) -> dict | None:
    if not s:
        return None
    s = s.strip()
    m = re.match(r"(\d+)/([A-Z]\d+)", s)
    if m:
        return {"detail": m.group(1), "sheet": m.group(2), "drawing_no": m.group(2), "label": s}
    return {"label": s}


def map_pdf_pages() -> dict[str, int]:
    reader = PdfReader(str(PDF))
    page_of: dict[str, int] = {}
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        for m in UNIT_PAT.finditer(text):
            base = m.group(1)
            span = text[max(0, m.start() - 5) : m.end() + 30]
            page_of[matrix_name(base, span)] = i
    if "A3.1C ANSI A" in page_of:
        page_of.setdefault("A3.1C ANSIA", page_of["A3.1C ANSI A"])
    return page_of


def parse_matrix() -> tuple[set[str], dict]:
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["MASTER"]
    matrix_types: set[str] = set()
    by_kc: dict[str, list[str]] = defaultdict(list)
    by_v1: dict[str, list[str]] = defaultdict(list)
    by_v2: dict[str, list[str]] = defaultdict(list)
    for row in ws.iter_rows(min_row=4, values_only=True):
        if not row[0]:
            continue
        ut = str(row[5]).strip() if row[5] else None
        if not ut:
            continue
        matrix_types.add(ut)
        if row[7]:
            by_kc[ut].append(str(row[7]).strip())
        if row[15]:
            by_v1[ut].append(str(row[15]).strip())
        if row[16]:
            by_v2[ut].append(str(row[16]).strip())
    return matrix_types, {"kc": by_kc, "v1": by_v1, "v2": by_v2}


def extract_pages(pages_needed: set[int]) -> dict[int, str]:
    OUT_PAGES.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(PDF))
    paths: dict[int, str] = {}
    for n in sorted(pages_needed):
        writer = PdfWriter()
        writer.add_page(reader.pages[n - 1])
        out = OUT_PAGES / f"page_{n:02d}.pdf"
        with out.open("wb") as f:
            writer.write(f)
        paths[n] = str(out)
    return paths


def main() -> None:
    page_of = map_pdf_pages()
    matrix_types, cols = parse_matrix()
    pages_needed = {page_of[t] for t in matrix_types if t in page_of}
    page_paths = extract_pages(pages_needed)

    out: dict = {
        "source_pdf": str(PDF),
        "page_paths": {str(k): v for k, v in page_paths.items()},
        "types": {},
        "gaps": {"layout": [], "kitchen_pdf": []},
    }

    for ut in sorted(matrix_types):
        kc_raw, mw = canonical_kitchen(cols["kc"][ut])
        v1 = parse_vanity(mode(cols["v1"][ut]) if cols["v1"][ut] else None)
        v2 = parse_vanity(mode(cols["v2"][ut]) if cols["v2"][ut] else None)
        page = page_of.get(ut)
        out["types"][ut] = {
            "layout_page": page,
            "layout_page_pdf": page_paths.get(page) if page else None,
            "kitchen_cab_raw": kc_raw,
            "kitchen_drawing_no": mw,
            "vanity_1": v1,
            "vanity_2": v2,
        }
        if not page:
            out["gaps"]["layout"].append(ut)
        if mw in CABINET_GAP:
            out["gaps"]["kitchen_pdf"].append(ut)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, indent=2))
    print(f"Wrote {OUT_JSON} — {len(out['types'])} types, {len(pages_needed)} pages, layout gaps: {len(out['gaps']['layout'])}")


if __name__ == "__main__":
    main()
