#!/usr/bin/env python3
"""Extract kitchen BOM lines from MW*.xls Counts Workbook takeoff files."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import xlrd

VANITY_SKU = re.compile(r"^(FHVSB|VF\d|VB09|VDB|VS\d)", re.I)


def norm_mw(stem: str) -> str:
    s = stem.strip().upper()
    if s.startswith("MUR_"):
        s = s[4:]
    m = re.match(r"^(MW[\d.]+)", s)
    return m.group(1) if m else s


def sheet_top_opp(name: str) -> str | None:
    u = name.upper()
    if "THUS" in u:
        return "THUS"
    if "OPP" in u:
        return "OPP"
    return None


def is_vanity(sku: str) -> bool:
    return bool(VANITY_SKU.match(sku.strip()))


def extract_file_troubadour(path: Path, project_name: str) -> list[dict]:
    mw_base = norm_mw(path.stem.split()[0])
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
            if sku in ("User code", "") or is_vanity(sku):
                continue
            rows.append(
                {
                    "project_name": project_name,
                    "mw_base": mw_base,
                    "top_opp": top_opp,
                    "scheme": "1",
                    "sku": sku,
                    "qty_per_unit": qty,
                    "sku_role": "hardware" if sku.upper() == "PULLS" else "cabinet",
                    "source_path": str(path),
                    "sheet_name": sn,
                }
            )
    return rows


def extract_file_hub_cabinet_list(path: Path, project_name: str) -> list[dict]:
    """Hub / CSMX MWxx.xls — single 'Cabinet List' sheet, qty col 2, SKU col 4."""
    mw_base = norm_mw(path.stem.split()[0])
    wb = xlrd.open_workbook(str(path))
    rows: list[dict] = []
    for sn in wb.sheet_names():
        sh = wb.sheet_by_name(sn)
        header_row = None
        for r in range(min(80, sh.nrows)):
            for c in range(min(8, sh.ncols)):
                if str(sh.cell_value(r, c)).strip().lower() == "user code":
                    header_row = r
                    break
            if header_row is not None:
                break
        if header_row is None:
            continue
        file_rows = []
        for r in range(header_row + 1, sh.nrows):
            sku_raw = sh.cell_value(r, 4) if sh.ncols > 4 else None
            if not sku_raw:
                continue
            sku = str(sku_raw).strip()
            if not sku or sku.lower() in {"user code", "tab"} or is_vanity(sku):
                continue
            try:
                qty = float(sh.cell_value(r, 2))
            except (TypeError, ValueError):
                qty = 1.0
            if qty <= 0:
                continue
            file_rows.append(
                {
                    "project_name": project_name,
                    "mw_base": mw_base,
                    "scheme": "1",
                    "sku": sku,
                    "qty_per_unit": qty,
                    "sku_role": "hardware" if sku.upper() == "PULLS" else "cabinet",
                    "source_path": str(path),
                    "sheet_name": sn,
                }
            )
        if not file_rows:
            continue
        # Hub takeoffs are not split THUS/OPP — matrix supplies orientation at join time.
        for top_opp in ("THUS", "OPP"):
            for row in file_rows:
                rows.append({**row, "top_opp": top_opp})
    return rows


def extract_kit_label(path: Path) -> str | None:
    wb = xlrd.open_workbook(str(path))
    sh = wb.sheet_by_index(0)
    for r in range(min(25, sh.nrows)):
        for c in range(sh.ncols):
            v = str(sh.cell_value(r, c))
            if ".kit" in v.lower():
                return v.split("\\")[-1].replace(".kit", "").strip()
    return None


def extract_file(path: Path, project_name: str) -> list[dict]:
    troub = extract_file_troubadour(path, project_name)
    if troub:
        return troub
    return extract_file_hub_cabinet_list(path, project_name)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="Directory containing MW*.xls files")
    ap.add_argument("--project-name", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    base = Path(args.dir)
    if not base.is_dir():
        print(json.dumps({"error": f"Directory not found: {base}"}))
        raise SystemExit(1)

    files = sorted(base.glob("MW*.xls")) + sorted(base.glob("MW*.XLS"))
    all_rows: list[dict] = []
    kit_labels: dict[str, str] = {}
    gaps: list[str] = []
    for path in files:
        try:
            mw = norm_mw(path.stem.split()[0])
            kit = extract_kit_label(path)
            if kit:
                kit_labels[mw] = kit
            all_rows.extend(extract_file(path, args.project_name))
        except Exception as e:
            gaps.append(f"{path.name}: {e}")

    keys = {(r["mw_base"], r["top_opp"]) for r in all_rows}
    payload = {
        "project_name": args.project_name,
        "source_dir": str(base),
        "file_count": len(files),
        "row_count": len(all_rows),
        "bom_key_count": len(keys),
        "distinct_skus": len({r["sku"] for r in all_rows}),
        "kit_labels": kit_labels,
        "rows": all_rows,
        "gaps": gaps,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(
        f"Wrote {out} — {len(all_rows)} lines, {len(keys)} BOM keys from {len(files)} MW xls files"
    )


if __name__ == "__main__":
    main()
