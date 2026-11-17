"""Script to rebuild punjab_mega.py cleanly and comprehensively."""

import os
import sys

ROOT_DIR = r"c:\Users\Abubakar Aijaz\Desktop\go-tour-go\go-tour-go-development"
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.landmark_builder.create_punjab_mega import PUNJAB_200
from scripts.landmark_builder.append_punjab import ADDITIONAL_PUNJAB
from scripts.landmark_builder.append_punjab_final import FINAL_PUNJAB_30

dest = os.path.join(ROOT_DIR, "scripts", "landmark_builder", "punjab_mega.py")

# Combine all lists
all_records = []
seen = set()

for lst in [PUNJAB_200, ADDITIONAL_PUNJAB, FINAL_PUNJAB_30]:
    for item in lst:
        slug = item[0]
        if slug not in seen:
            seen.add(slug)
            all_records.append(item)

print(f"Total unique Punjab mega records: {len(all_records)}")

# Write clean file
file_lines = [
    '"""Punjab Mega Dataset for GoTourGo."""',
    'from __future__ import annotations',
    'from scripts.landmark_builder.generator import make_clean_record',
    '',
    'PUNJAB_MEGA_DATA = ['
]

for t in all_records:
    file_lines.append(f'    {repr(t)},')

file_lines.extend([
    ']',
    '',
    'def get_punjab_mega() -> list[dict]:',
    '    records = []',
    '    for item in PUNJAB_MEGA_DATA:',
    '        records.append(make_clean_record(',
    '            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region="Punjab",',
    '            lat=item[5], lon=item[6], radius=item[7], short_en=item[8], short_ur=item[9], desc_en=item[10], desc_ur=item[11]',
    '        ))',
    '    return records',
    ''
])

with open(dest, "w", encoding="utf-8") as f:
    f.write("\n".join(file_lines))

print(f"Cleanly wrote {len(all_records)} landmarks to {dest}!")
