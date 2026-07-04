#!/usr/bin/env python3
"""Parse Morgan Hill Matrix MASTER -> unit BOM keys for Counts Workbook join."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

DEFAULT_XLSX = Path(
    "/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/"
    "25048 - Carrollton, TX - Morgan Hill/PROJECT MANAGING/SHOP DRAWINGS/"
    "Morgan Hill Matrix NEW.xlsx"
)


def norm(v):
    if v is None or v == "":
        return None
    return str(v).strip()


def parse_kitchen_cab(kc: str | None) -> dict | None:
    kc = norm(kc)
    if not kc:
        return None
    mw_base = re.sub(r"_SCH\d+$", "", kc, flags=re.I)
    m = re.search(r"_SCH(\d+)$", kc, flags=re.I)
    scheme = m.group(1) if m else None
    return {"kitchen_cab": kc, "mw_base": mw_base, "scheme": scheme}


def parse_top_opp(raw: str | None) -> str | None:
    s = (norm(raw) or "").upper()
    if not s:
        return None
    return "THUS" if s.startswith("T") else "OPP"


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
        unit_type_name = norm(row[5]) if len(row) > 5 else None
        thus_opp = parse_top_opp(row[6] if len(row) > 6 else None)
        cab = parse_kitchen_cab(row[7] if len(row) > 7 else None)
        scheme_col = norm(row[8]) if len(row) > 8 else None
        if cab and not cab.get("scheme") and scheme_col:
            if "1" in scheme_col:
                cab["scheme"] = "1"
            elif "2" in scheme_col:
                cab["scheme"] = "2"
        if not cab or not thus_opp:
            continue
        units.append(
            {
                "unit_number": unit_number,
                "unit_type_name": unit_type_name,
                "top_opp": thus_opp,
                **cab,
            }
        )
    wb.close()
    print(json.dumps({"source": str(xlsx), "units": units, "count": len(units)}))


if __name__ == "__main__":
    main()
