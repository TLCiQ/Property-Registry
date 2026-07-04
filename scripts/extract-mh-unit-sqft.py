#!/usr/bin/env python3
"""Extract unit-type square footage from UNIT PLANS_5.2025.pdf (actual plan annotations)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/"
    "25048 - Carrollton, TX - Morgan Hill/PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/UNIT PLANS_5.2025.pdf"
)
OUT = ROOT / ".firecrawl" / "mh-unit-sqft.json"

UNIT_PAT = re.compile(
    r"UNIT\s+([AB]\d+\.\d+[A-Z])\s+(?:(?:ANSI(?:\s*TYPE)?\s*A|ANSIA)\s+)?(?:FLOOR\s+)?PLAN\s*"
    r"([\d,]+)\s*S\.F\.\s*([\d,]+)\s*S\.F\.",
    re.I,
)
# PDF text sometimes drops the second " S.F." before unit count (e.g. "1,40801 UNITS").
UNIT_PAT_GLUE = re.compile(
    r"UNIT\s+([AB]\d+\.\d+[A-Z])\s+(?:(?:ANSI(?:\s*TYPE)?\s*A|ANSIA)\s+)?(?:FLOOR\s+)?PLAN\s*"
    r"([\d,]+)\s*S\.F\.\s*([\d,]+)\d{0,2}\s*UNITS",
    re.I,
)

SQFT_ALIASES = {"A3.1C ANSIA": "A3.1C ANSI A"}


def to_int(s: str) -> int:
    return int(s.replace(",", ""))


def matrix_name(base: str, span: str) -> str:
    if re.search(r"ANSIA", span, re.I):
        return f"{base} ANSIA"
    if re.search(r"ANSI", span, re.I):
        return f"{base} ANSI A"
    return base


def record_match(by_type: dict, page_num: int, text: str, m: re.Match) -> None:
    base = m.group(1).strip()
    span = text[max(0, m.start() - 5) : m.end() + 20]
    name = matrix_name(base, span)
    net_sf = to_int(m.group(2))
    gross_sf = to_int(m.group(3))
    prev = by_type.get(name)
    if prev and (prev["net_sqft"], prev["gross_sqft"]) != (net_sf, gross_sf):
        prev.setdefault("conflicts", []).append(
            {"page": page_num, "net_sqft": net_sf, "gross_sqft": gross_sf}
        )
    else:
        by_type[name] = {
            "unit_type_name": name,
            "net_sqft": net_sf,
            "gross_sqft": gross_sf,
            "source_page": page_num,
            "source": "UNIT PLANS_5.2025.pdf",
        }


def main() -> None:
    if not PDF.exists():
        print(json.dumps({"error": f"PDF not found: {PDF}"}))
        raise SystemExit(1)

    reader = PdfReader(str(PDF))
    by_type: dict[str, dict] = {}

    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        for m in UNIT_PAT.finditer(text):
            record_match(by_type, page_num, text, m)
        for m in UNIT_PAT_GLUE.finditer(text):
            base = m.group(1).strip()
            span = text[max(0, m.start() - 5) : m.end() + 20]
            name = matrix_name(base, span)
            if name in by_type:
                continue
            record_match(by_type, page_num, text, m)

    for alias, canonical in SQFT_ALIASES.items():
        if canonical in by_type and alias not in by_type:
            by_type[alias] = {**by_type[canonical], "unit_type_name": alias, "alias_of": canonical}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "source_pdf": str(PDF),
                "types": by_type,
                "count": len(by_type),
            },
            indent=2,
        )
    )
    print(f"Wrote {OUT} — {len(by_type)} unit types with sqft")


if __name__ == "__main__":
    main()
