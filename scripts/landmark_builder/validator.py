"""Validation module enforcing the exact GoTourGo database trigger rules.

Checks bounds, enums, regexes, and bilateral language parity for all rows.
"""

from __future__ import annotations

import re

VALID_CATEGORIES = {
    "historical", "religious", "museum", "cultural",
    "attraction", "viewpoint", "park", "nature", "food", "shopping",
}

VALID_REGIONS = {
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
    "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory",
}

PAIR_COLS = [
    ("history", "history_ur"),
    ("significance", "significance_ur"),
    ("culture", "culture_ur"),
    ("local_customs", "local_customs_ur"),
    ("food", "food_ur"),
    ("shopping", "shopping_ur"),
    ("tips", "tips_ur"),
]

SLUG_PATTERN = re.compile(r"^[a-z0-9-]{2,80}$")


def validate_row(row: dict) -> list[str]:
    errors = []
    slug = (row.get("slug") or "").strip().lower()
    ref = slug or "(missing slug)"

    if not slug or not SLUG_PATTERN.match(slug):
        errors.append(f"Row {ref}: slug must be 2-80 lowercase letters, digits or '-'. Got '{slug}'")

    if not (row.get("name") or "").strip() or not (row.get("name_ur") or "").strip():
        errors.append(f"Row {ref}: name and name_ur are both required.")

    cat = (row.get("category") or "").strip().lower()
    if cat not in VALID_CATEGORIES:
        errors.append(f"Row {ref}: category '{cat}' is not valid.")

    city = (row.get("city") or "").strip()
    if not city:
        errors.append(f"Row {ref}: city is required.")

    region = (row.get("region") or "").strip()
    if region not in VALID_REGIONS:
        errors.append(f"Row {ref}: region '{region}' is not valid.")

    try:
        lat = float(str(row.get("latitude")).strip())
        lon = float(str(row.get("longitude")).strip())
        if not (23.5 <= lat <= 37.2 and 60.8 <= lon <= 77.9):
            errors.append(f"Row {ref}: coordinates ({lat}, {lon}) outside Pakistan bounding box.")
    except Exception:
        errors.append(f"Row {ref}: latitude/longitude must be numbers.")

    try:
        radius = int(round(float(str(row.get("radius_m")).strip())))
        if not (50 <= radius <= 5000):
            errors.append(f"Row {ref}: radius_m must be 50-5000. Got {radius}")
    except Exception:
        errors.append(f"Row {ref}: radius_m must be a valid integer.")

    if not (row.get("short_description") or "").strip() or not (row.get("short_description_ur") or "").strip():
        errors.append(f"Row {ref}: short_description and short_description_ur are both required.")

    if not (row.get("description") or "").strip() or not (row.get("description_ur") or "").strip():
        errors.append(f"Row {ref}: description and description_ur are both required.")

    for en_col, ur_col in PAIR_COLS:
        en_val = (row.get(en_col) or "").strip()
        ur_val = (row.get(ur_col) or "").strip()
        en_empty = not en_val or en_val == "null"
        ur_empty = not ur_val or ur_val == "null"
        if en_empty != ur_empty:
            errors.append(f"Row {ref}: {en_col} is filled in one language only (en: {not en_empty}, ur: {not ur_empty}). Both or neither required.")

    return errors
