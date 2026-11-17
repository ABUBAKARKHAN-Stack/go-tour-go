"""Master script to generate GoTourGo 1,500 Landmarks Dataset.

Heavily focused on Sindh (550+ landmarks) and Karachi (220+ landmarks),
alongside comprehensive coverage across Punjab (350), KP (220), Balochistan (150),
Gilgit-Baltistan (130), Azad Kashmir (70), and Islamabad (30).
"""

from __future__ import annotations

import csv
import math
import os
import re
from typing import Dict, List

from scripts.landmark_builder.enricher import get_cleaned_existing
from scripts.landmark_builder.validator import validate_row

OUTPUT_CSV = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "docs", "landmarks-import", "landmarks-1500-final.csv")
)
ORIGINAL_CSV = r"C:\Users\Abubakar Aijaz\Downloads\Supabase Snippet Untitled query.csv"


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return s[:75]
