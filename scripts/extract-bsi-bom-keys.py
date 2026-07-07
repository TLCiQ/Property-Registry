#!/usr/bin/env python3
"""Extract per-unit kitchen BOM keys (MW + THUS/OPP) from BSI matrix xlsx."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import openpyxl


def norm_unit(val) -> str | None:
    if val is None or val == "":
        return None
    if isinstance(val, (int, float)) and float(val).is_integer():
        return str(int(float(val)))
    s = str(val).strip()
    if not s or s in {".", "-", "Level 7", "Level 5"} or s.lower().startswith("level "):
        return None
    if s.upper().startswith("TIER "):
        return None
    return s


def parse_top_opp(raw) -> str | None:
    if raw is None or raw == "":
        return None
    s = str(raw).strip().upper()
    if not s or s == ".":
        return None
    if s.startswith("T") or s == "THUS":
        return "THUS"
    if s.startswith("O") or s == "OPP":
        return "OPP"
    return None


def norm_mw(raw) -> str | None:
    if raw is None or raw == "":
        return None
    s = str(raw).strip().upper()
    if not s or s in {".", "TRUE", "FALSE"}:
        return None
    if s.startswith("MUR_"):
        s = s[4:]
    m = re.match(r"^(MW[\d.]+)", s)
    if not m:
        return None
    code = m.group(1)
    m2 = re.match(r"^MW(\d+(?:\.\d+)?)([A-Z]?)$", code, re.I)
    if not m2:
        return code
    num, suffix = m2.group(1), m2.group(2)
    if "." in num:
        a, b = num.split(".", 1)
        num = f"{int(a):02d}.{b}"
    else:
        num = f"{int(num):02d}"
    return f"MW{num}{suffix}"


def resolve_mw_col(headers: list[str]) -> str | None:
    lower = [h.lower() for h in headers]
    for prefer in (
        "shop drawing",
        "kitchen sd",
        "drawing",
        "kitchen cab",
        "kitchen",
    ):
        for i, h in enumerate(lower):
            if prefer in h and "counter" not in h and "top" not in h and "type" not in h:
                return headers[i]
    return None


def score_sheet(headers: list[str]) -> int:
    lower = [h.lower() for h in headers]
    score = 0
    if any("unit #" in h or h == "unit #" for h in lower):
        score += 5
    if resolve_mw_col(headers):
        score += 4
    if any("thus" in h for h in lower):
        score += 3
    if any("unit type" in h for h in lower):
        score += 2
    if any("all building" in h for h in headers):
        score += 1
    return score


def extract_sheet(ws, sheet_name: str) -> list[dict]:
    best = None
    for ri, row in enumerate(ws.iter_rows(min_row=1, max_row=12, values_only=True), 1):
        headers = [str(c).strip() if c is not None else "" for c in row]
        sc = score_sheet(headers)
        if sc >= 9 and (best is None or sc > best[0]):
            best = (sc, ri, headers)

    if not best:
        return []

    _, header_row, headers = best
    col = {headers[i]: i for i in range(len(headers)) if headers[i]}
    unit_col = next((col[k] for k in col if "unit #" in k.lower()), None)
    thus_col = next((col[k] for k in col if "thus" in k.lower()), None)
    mw_header = resolve_mw_col(headers)
    mw_col = col.get(mw_header) if mw_header else None
    type_col = next((col[k] for k in col if "unit type" in k.lower()), None)

    if unit_col is None or mw_col is None or thus_col is None:
        return []

    units = []
    for row in ws.iter_rows(min_row=header_row + 1, values_only=True):
        if unit_col >= len(row):
            continue
        unit_number = norm_unit(row[unit_col])
        if not unit_number:
            continue
        top_opp = parse_top_opp(row[thus_col] if thus_col < len(row) else None)
        kitchen_raw = row[mw_col] if mw_col < len(row) else None
        mw_base = norm_mw(kitchen_raw)
        if not top_opp or not mw_base:
            continue
        units.append(
            {
                "unit_number": unit_number,
                "unit_type_name": str(row[type_col]).strip() if type_col is not None and type_col < len(row) and row[type_col] else None,
                "thus_opp": top_opp,
                "kitchen_cab": str(kitchen_raw).strip() if kitchen_raw else mw_base,
                "mw_base": mw_base,
                "sheet": sheet_name,
            }
        )
    return units


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    xlsx = Path(args.xlsx)
    if not xlsx.exists():
        print(json.dumps({"error": f"Matrix not found: {xlsx}"}))
        raise SystemExit(1)

    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    all_units: dict[str, dict] = {}
    sheets_used = []

    for sn in wb.sheetnames:
        ws = wb[sn]
        extracted = extract_sheet(ws, sn)
        if extracted:
            sheets_used.append(sn)
            for u in extracted:
                all_units[u["unit_number"]] = u

    wb.close()
    units = list(all_units.values())
    payload = {
        "source": str(xlsx),
        "sheets": sheets_used,
        "units": units,
        "count": len(units),
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {out} — {len(units)} units w/ BOM keys from {len(sheets_used)} sheet(s)")


if __name__ == "__main__":
    main()
