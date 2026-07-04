#!/usr/bin/env python3
"""Extract vanity SKUs from Troubadour Counts Workbook MW*.xls → JSON."""
from __future__ import annotations

import json
import re
from pathlib import Path

import xlrd

BASE = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/"
    "25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/"
    "Counts Workbook/2020 Cabinet Takeoffs"
)
OUT = Path(__file__).resolve().parent.parent / ".firecrawl" / "troubadour-vanity-bom.json"
PROJECT_NAME = "Lubbock, TX - 14th Street SH"
PROJECT_DEAL = "25019"

VANITY_SKU = re.compile(r"^(FHVSB|VF\d|VB09|VDB|VS\d)", re.I)
KNOWN_VANITY = {
    "FHVSB24",
    "FHVSB27",
    "FHVSB30",
    "FHVSB36REM",
    "FHVSB31REM",
    "FHVSB33REM",
    "FHVSB42REM",
    "VF1",
    "VF3",
    "VF3-1.5",
    "VB09L",
    "VB09R",
    "VDB12-3",
}


def is_vanity_sku(sku: str) -> bool:
    s = sku.strip().upper()
    return s in {x.upper() for x in KNOWN_VANITY} or bool(VANITY_SKU.match(s))


def sheet_top_opp(sheet_name: str) -> str | None:
    u = sheet_name.upper()
    if "THUS" in u:
        return "THUS"
    if "OPP" in u:
        return "OPP"
    return None


def main() -> None:
    lines: list[dict] = []
    for path in sorted(BASE.glob("MW*.xls")):
        mw_base = path.stem
        wb = xlrd.open_workbook(str(path))
        for sn in wb.sheet_names():
            top_opp = sheet_top_opp(sn)
            if not top_opp:
                continue
            sh = wb.sheet_by_name(sn)
            for r in range(sh.nrows):
                try:
                    qty = float(sh.cell_value(r, 2))
                except (TypeError, ValueError):
                    continue
                if qty <= 0:
                    continue
                sku_raw = sh.cell_value(r, 4)
                if not sku_raw:
                    continue
                sku = str(sku_raw).strip()
                if not is_vanity_sku(sku):
                    continue
                lines.append(
                    {
                        "project_name": PROJECT_NAME,
                        "project_deal": PROJECT_DEAL,
                        "scheme": "1",
                        "mw_base": mw_base,
                        "top_opp": top_opp,
                        "sku": sku,
                        "qty_per_unit": qty,
                        "sku_role": "vanity",
                        "source_file": path.name,
                        "source_sheet": sn,
                    }
                )

    keys = {(l["mw_base"], l["top_opp"]) for l in lines}
    payload = {
        "project_name": PROJECT_NAME,
        "project_deal": PROJECT_DEAL,
        "count": len(lines),
        "keys": len(keys),
        "distinct_skus": len({l["sku"] for l in lines}),
        "lines": lines,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} — {len(lines)} vanity lines, {len(keys)} BOM keys")


if __name__ == "__main__":
    main()
