#!/usr/bin/env python3
"""Build Troubadour unit-type → shop drawing links from Matrix + countertop PDF index."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    from PyPDF2 import PdfReader  # type: ignore

ROOT = Path(__file__).resolve().parent.parent
MATRIX_JSON = ROOT / ".firecrawl" / "troubadour-matrix.json"
OUT = ROOT / ".firecrawl" / "troubadour-matrix-drawings.json"
COUNTERTOP_PDF = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/"
    "25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Countertops/"
    "Lubbock TX -  14th St - Countertop Shop Drawing FINAL 5.16.26.pdf"
)


def normalize_cab(raw: str | None) -> str | None:
    if not raw:
        return None
    s = str(raw).strip()
    if s.upper().startswith("MUR_"):
        s = s[4:]
    m = re.match(r"^MW(\d+)\.(\d+)$", s, re.I)
    if m:
        return f"MW{int(m.group(1)):02d}.{m.group(2)}"
    return s


def normalize_d(raw: str | None) -> str | None:
    if not raw:
        return None
    s = str(raw).strip().upper().replace(" ", "")
    m = re.match(r"^D-?(\d+)$", s)
    if not m:
        return None
    return f"D-{int(m.group(1)):02d}"


def build_d_page_index(pdf_path: Path) -> dict[str, int]:
    reader = PdfReader(str(pdf_path))
    hits: dict[str, list[int]] = defaultdict(list)
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            continue
        for m in re.finditer(r"\bD-?\s*(\d{1,3})\b", text):
            key = f"D-{int(m.group(1)):02d}"
            hits[key].append(i)
    return {k: min(v) for k, v in hits.items()}


def main() -> None:
    if not MATRIX_JSON.exists():
        raise SystemExit(f"Missing {MATRIX_JSON} — run extract-troubadour-matrix.py first")
    if not COUNTERTOP_PDF.exists():
        raise SystemExit(f"Missing countertop PDF: {COUNTERTOP_PDF}")

    matrix = json.loads(MATRIX_JSON.read_text(encoding="utf-8"))
    d_pages = build_d_page_index(COUNTERTOP_PDF)

    units_by_type: dict[str, list[dict]] = defaultdict(list)
    for u in matrix["units"]:
        if u.get("unit_type"):
            units_by_type[u["unit_type"]].append(u)

    types: dict[str, dict] = {}
    all_d_refs: set[str] = set()
    all_mw: set[str] = set()

    for type_name, units in sorted(units_by_type.items()):
        variant_map: dict[tuple[str, str], dict] = {}
        bath1 = Counter()
        bath2 = Counter()
        kitchen_top = Counter()

        for u in units:
            thus = str(u.get("thus_opp") or "").strip() or "?"
            cab = normalize_cab(u.get("kitchen_cab")) or "?"
            key = (thus, cab)
            d = u.get("drawings") or {}
            kt = normalize_d(d.get("KITCHEN TOP SD"))
            b1 = normalize_d(d.get("BATH TOP SD"))
            b2 = normalize_d(d.get("BATH 2 TOP SD"))
            if kt:
                kitchen_top[kt] += 1
            if b1:
                bath1[b1] += 1
            if b2:
                bath2[b2] += 1
            if key not in variant_map:
                variant_map[key] = {
                    "thus_opp": thus,
                    "kitchen_cab": cab,
                    "kitchen_cab_raw": u.get("kitchen_cab"),
                    "kitchen_top_sd": kt,
                    "bath_top_sd": b1,
                    "bath_2_top_sd": b2,
                    "unit_count": 0,
                }
            variant_map[key]["unit_count"] += 1
            if cab != "?":
                all_mw.add(cab)

        variants = sorted(variant_map.values(), key=lambda v: (-v["unit_count"], v["thus_opp"]))
        spec = {
            "unit_count": len(units),
            "kitchen_variants": variants,
            "bath_1_d": bath1.most_common(1)[0][0] if bath1 else None,
            "bath_2_d": bath2.most_common(1)[0][0] if bath2 else None,
            "kitchen_top_d": kitchen_top.most_common(1)[0][0] if kitchen_top else None,
        }
        for d in (spec["bath_1_d"], spec["bath_2_d"], spec["kitchen_top_d"]):
            if d:
                all_d_refs.add(d)
        for v in variants:
            for d in (v.get("kitchen_top_sd"), v.get("bath_top_sd"), v.get("bath_2_top_sd")):
                if d:
                    all_d_refs.add(d)
        types[type_name] = spec

    missing_d = sorted(d for d in all_d_refs if d not in d_pages)
    payload = {
        "property_id": "095960e3-5b22-4a0c-9528-e3843fed3ede",
        "countertop_pdf": str(COUNTERTOP_PDF),
        "countertop_page_count": len(PdfReader(str(COUNTERTOP_PDF)).pages),
        "d_sheet_pages": {k: d_pages[k] for k in sorted(all_d_refs) if k in d_pages},
        "missing_d_sheets": missing_d,
        "kitchen_cab_codes": sorted(all_mw),
        "types": types,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} — {len(types)} types, {len(payload['d_sheet_pages'])} D sheets indexed, {len(missing_d)} missing")


if __name__ == "__main__":
    main()
