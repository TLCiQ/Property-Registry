#!/usr/bin/env python3
"""Parse Morgan Hill Matrix MASTER -> per-unit facts (all columns, actuals only)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/"
    "25048 - Carrollton, TX - Morgan Hill/PROJECT MANAGING/SHOP DRAWINGS/"
    "Morgan Hill Matrix NEW.xlsx"
)
OUT = ROOT / ".firecrawl" / "mh-unit-facts.json"


def norm(v) -> str | None:
    if v is None or v == "":
        return None
    return str(v).strip()


def parse_top_opp(raw) -> str | None:
    s = (norm(raw) or "").upper()
    if not s:
        return None
    return "THUS" if s.startswith("T") else "OPP"


def parse_elev(raw) -> dict | None:
    s = norm(raw)
    if not s:
        return None
    m = re.match(r"(\d+(?:-\d+)?)/([A-Z]\d+)", s)
    if m:
        return {"detail": m.group(1), "sheet": m.group(2), "label": s}
    return {"label": s}


def parse_scheme(raw, kitchen_cab: str | None) -> str | None:
    s = (norm(raw) or "").lower()
    if "1" in s:
        return "1"
    if "2" in s:
        return "2"
    kc = norm(kitchen_cab) or ""
    m = re.search(r"_SCH(\d+)", kc, re.I)
    return m.group(1) if m else None


def main() -> None:
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx.exists():
        print(json.dumps({"error": f"Matrix not found: {xlsx}"}))
        sys.exit(1)

    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    ws = wb["MASTER"]
    units = []

    for row in ws.iter_rows(min_row=4, values_only=True):
        if not row or row[0] in (None, ""):
            continue
        unit_number = str(int(row[0])) if isinstance(row[0], (int, float)) else str(row[0]).strip()
        kitchen_cab = norm(row[7]) if len(row) > 7 else None
        units.append(
            {
                "unit_number": unit_number,
                "level_building": norm(row[1]) if len(row) > 1 else None,
                "construction_area": norm(row[2]) if len(row) > 2 else None,
                "truck_no": int(row[3]) if len(row) > 3 and row[3] is not None else None,
                "phase_no": int(row[4]) if len(row) > 4 and row[4] is not None else None,
                "unit_type_name": norm(row[5]) if len(row) > 5 else None,
                "top_opp": parse_top_opp(row[6] if len(row) > 6 else None),
                "kitchen_cab": kitchen_cab,
                "scheme": parse_scheme(row[8] if len(row) > 8 else None, kitchen_cab),
                "soffit": norm(row[9]) if len(row) > 9 else None,
                "matrix_notes": norm(row[10]) if len(row) > 10 else None,
                "kitchen_run_elev": parse_elev(row[11] if len(row) > 11 else None),
                "kitchen_run_elev_2": parse_elev(row[12] if len(row) > 12 else None),
                "kitchen_island_elev": parse_elev(row[13] if len(row) > 13 else None),
                "desk_elev": parse_elev(row[14] if len(row) > 14 else None),
                "vanity_1_elev": parse_elev(row[15] if len(row) > 15 else None),
                "vanity_2_elev": parse_elev(row[16] if len(row) > 16 else None),
            }
        )

    wb.close()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": str(xlsx), "units": units, "count": len(units)}, indent=2))
    print(f"Wrote {OUT} — {len(units)} units")


if __name__ == "__main__":
    main()
