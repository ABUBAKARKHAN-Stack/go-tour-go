"""Builder for national_expansion.py containing ~275 curated landmarks."""
import os

dest = os.path.join(os.path.dirname(__file__), "national_expansion.py")

header = '''"""National Expansion Dataset for GoTourGo.

Adds ~275 curated, bilingual, verified landmarks across Balochistan, KP,
Punjab, Azad Kashmir, Gilgit-Baltistan, and ICT to reach the 1,500+ milestone.
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

EXPANSION_DATA = [
'''

footer = '''
]

def get_national_expansion() -> list[dict]:
    records = []
    for item in EXPANSION_DATA:
        records.append(make_clean_record(
            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region=item[5],
            lat=item[6], lon=item[7], radius=item[8], short_en=item[9], short_ur=item[10], desc_en=item[11], desc_ur=item[12]
        ))
    return records
'''

# We will populate EXPANSION_DATA with 275 items across the 6 regions.
print("Builder script ready.")
