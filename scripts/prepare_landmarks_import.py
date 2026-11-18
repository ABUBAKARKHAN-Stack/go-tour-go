"""
Turns docs/landmarks-import/landmarks-curated-master.csv into the JSON the
database import reads (docs/landmarks-import/landmarks-curated-master.json).

Normalises what the database requires:
- category: free-text labels -> one of the 10 app categories
- region: "Azad Jammu & Kashmir" -> "Azad Kashmir" (the app's name)
- source: "curated_grounded" -> "curated" (allowed: curated, osm)
- id: keeps real UUIDs; rows with a number get a stable UUID made from their slug
- featured: true/false; empty text -> null

Run: python3 scripts/prepare_landmarks_import.py
"""
import csv
import json
import re
import sys
import uuid
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/landmarks-import/landmarks-curated-master.csv'
OUT = ROOT / 'docs/landmarks-import/landmarks-curated-master.json'

CATEGORIES = {'historical', 'religious', 'attraction', 'viewpoint', 'cultural', 'museum', 'food', 'shopping', 'park', 'nature'}
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
NAMESPACE = uuid.UUID('6f1c2b1e-9a51-4c3e-8a7e-0c1d9e5b7a10')  # GoTourGo landmarks

# First match wins: specific kinds before broad ones.
RULES = [
    ('museum', ['museum']),
    ('religious', ['mosque', 'masjid', 'shrine', 'sufi', 'temple', 'church', 'cathedral', 'gurdwara', 'religious', 'spiritual', 'sacred', 'dargah']),
    ('food', ['food', 'culinary']),
    ('shopping', ['shopping', 'bazaar', 'market']),
    ('historical', ['historic', 'heritage', 'fort', 'palace', 'mausoleum', 'tomb', 'necropolis', 'archaeolog', 'colonial', 'monument', 'unesco', 'gateway', 'haveli', 'ancient']),
    ('park', ['park', 'garden', 'wildlife', 'zoo', 'botanical', 'sanctuary']),
    ('viewpoint', ['viewpoint', 'view point']),
    ('nature', ['nature', 'natural', 'scenic', 'lake', 'valley', 'glacier', 'waterfall', 'mountain', 'forest', 'beach', 'coast', 'desert', 'island', 'alpine', 'meadow', 'wetland', 'peak', 'canyon', 'gorge', 'pass', 'river', 'hill', 'oasis', 'oases', 'geolog', 'reservoir', 'orchard', 'agricultural', 'marine']),
    ('cultural', ['cultur', 'civic', 'literary', 'architect']),
    ('attraction', ['attraction', 'adventure', 'modern', 'landmark', 'sports', 'engineering', 'infrastructure', 'maritime', 'water sports', 'royal']),
]


def category(label: str) -> str:
    low = label.strip().lower()
    if low in CATEGORIES:
        return low
    for cat, words in RULES:
        if any(w in low for w in words):
            return cat
    return 'attraction'


def text(v):
    v = (v or '').strip()
    return v or None


def main():
    rows = list(csv.DictReader(SRC.open(encoding='utf-8')))
    out, mapping = [], Counter()
    for r in rows:
        cat = category(r['category'])
        mapping[(r['category'].strip(), cat)] += 1
        rid = r['id'].strip().lower()
        if not UUID.match(rid):
            rid = str(uuid.uuid5(NAMESPACE, r['slug'].strip()))
        region = r['region'].strip()
        if region == 'Azad Jammu & Kashmir':
            region = 'Azad Kashmir'
        item = {
            'id': rid,
            'slug': r['slug'].strip(),
            'name': r['name'].strip(),
            'name_ur': text(r['name_ur']),
            'category': cat,
            'city': r['city'].strip(),
            'region': region,
            'latitude': float(r['latitude']),
            'longitude': float(r['longitude']),
            'radius_m': int(round(float(r['radius_m']))),
            'featured': r['featured'].strip().lower() == 'true',
            'source': 'osm' if r['source'].strip() == 'osm' else 'curated',
        }
        for f in ['short_description', 'description', 'history', 'significance', 'culture', 'local_customs', 'food', 'shopping', 'tips',
                  'opening_hours', 'entry_fee', 'best_time', 'image_url', 'wikipedia_url']:
            item[f] = text(r.get(f))
        for f in ['short_description', 'description', 'history', 'significance', 'culture', 'local_customs', 'food', 'shopping', 'tips']:
            item[f + '_ur'] = text(r.get(f + '_ur'))
        out.append(item)

    # Checks the database also enforces.
    assert len({o['id'] for o in out}) == len(out), 'duplicate ids'
    assert len({o['slug'] for o in out}) == len(out), 'duplicate slugs'
    for o in out:
        assert re.fullmatch(r'[a-z0-9-]{2,80}', o['slug']), o['slug']
        assert 23.5 <= o['latitude'] <= 37.2 and 60.8 <= o['longitude'] <= 77.9, o['slug']
        assert 50 <= o['radius_m'] <= 5000, o['slug']
        assert o['short_description'] and o['description'], o['slug']

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(out)} landmarks -> {OUT.relative_to(ROOT)}')
    if '-v' in sys.argv:
        for (src, cat), n in sorted(mapping.items(), key=lambda x: (x[0][1], x[0][0])):
            print(f'{cat:11} <- {src} ({n})')
    print(Counter(o['category'] for o in out))


if __name__ == '__main__':
    main()
