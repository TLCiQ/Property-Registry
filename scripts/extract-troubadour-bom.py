#!/usr/bin/env python3
"""Extract Troubadour Counts Workbook MW*.xls BOMs → JSON for Registry SKU bridge."""
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
OUT = Path(__file__).resolve().parent.parent / ".firecrawl" / "troubadour-bom.json"
PROJECT_NAME = "Lubbock, TX - 14th Street SH"
VANITY_SKU = re.compile(r"^(FHVSB|VF\d|VB09|VDB|VS\d)", re.I)


def is_vanity_sku(sku: str) -> bool:
    return bool(VANITY_SKU.match(sku.strip()))


def norm_mw(code: str | None) -> str | None:
    if not code:
        return None
    c = str(code).strip().upper()
    if c.startswith("MUR_"):
        c = c[4:]
    m = re.match(r"^MW(\d+(?:\.\d+)?)$", c, re.I)
    if not m:
        return c
    num = m.group(1)
    if "." in num:
        a, b = num.split(".", 1)
        num = f"{int(a):02d}.{b}"
    else:
        num = f"{int(num):02d}"
    return f"MW{num}"


def sheet_top_opp(sheet_name: str) -> str | None:
    u = sheet_name.upper()
    if "THUS" in u:
        return "THUS"
    if "OPP" in u:
        return "OPP"
    return None


def extract_file(path: Path) -> list[dict]:
    mw_base = path.stem
    wb = xlrd.open_workbook(str(path))
    rows: list[dict] = []
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
            if sku in ("User code", "") or is_vanity_sku(sku):
                continue
            sku_role = "hardware" if sku.upper() == "PULLS" else "cabinet"
            rows.append(
                {
                    "project_name": PROJECT_NAME,
                    "mw_base": mw_base,
                    "top_opp": top_opp,
                    "scheme": "1",
                    "sku": sku,
                    "qty_per_unit": qty,
                    "sku_role": sku_role,
                    "source_path": str(path),
                    "sheet_name": sn,
                }
            )
    return rows


def main() -> None:
    if not BASE.is_dir():
        raise SystemExit(f"Counts Workbook dir not found: {BASE}")

    all_rows: list[dict] = []
    files = sorted(BASE.glob("MW*.xls"))
    gaps: list[str] = []

    for path in files:
        try:
            all_rows.extend(extract_file(path))
        except Exception as e:
            gaps.append(f"{path.name}: {e}")

    keys = {(r["mw_base"], r["top_opp"]) for r in all_rows}
    payload = {
        "project_name": PROJECT_NAME,
        "source_dir": str(BASE),
        "file_count": len(files),
        "row_count": len(all_rows),
        "bom_key_count": len(keys),
        "distinct_skus": len({r["sku"] for r in all_rows}),
        "rows": all_rows,
        "gaps": gaps,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(
        f"Wrote {OUT} — {len(all_rows)} lines, {len(keys)} BOM keys, "
        f"{payload['distinct_skus']} SKUs from {len(files)} files"
    )


if __name__ == "__main__":
    main()
