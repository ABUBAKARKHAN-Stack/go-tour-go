"""Extract Pakistan places and famous landmarks from OpenStreetMap and enrich
the landmarks with Wikidata, Wikipedia and Wikimedia Commons.

Writes two CSV files matching the staging tables in the
20261105063838_places_landmarks migration:

    places.csv     cities, towns, villages, neighbourhoods and notable places
    landmarks.csv  famous landmarks with category, alert radius, description, photo

Usage:
    python scripts/import_pakistan_data.py <pakistan.osm.pbf> <out_dir> [--no-enrich]

Data: OpenStreetMap contributors (ODbL); Wikipedia text (CC BY-SA 4.0);
Wikidata (CC0); photos keep their Commons author and licence.
"""

from __future__ import annotations

import csv
import html
import math
import os
import re
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from urllib.parse import quote

import osmium
import shapely.wkb
from shapely.geometry import Point
from shapely.strtree import STRtree

USER_AGENT = "GoTourGo-data-import/1.0 (https://github.com/ABUBAKARKHAN-Stack/go-tour-go)"
PAKISTAN_BBOX = (60.5, 23.3, 77.9, 37.2)

# ---------------------------------------------------------------------------
# Classification (pure functions, unit tested)
# ---------------------------------------------------------------------------

PLACE_RANK = {
    "city": 100, "town": 80, "suburb": 60, "borough": 60, "quarter": 50,
    "neighbourhood": 50, "village": 40, "locality": 30, "hamlet": 20,
}

# Named places that people search for as destinations.
POI_KINDS = [
    ("aeroway", "aerodrome", "airport", 60),
    ("amenity", "university", "university", 45),
    ("amenity", "hospital", "hospital", 40),
    ("railway", "station", "railway_station", 40),
    ("shop", "mall", "mall", 40),
    ("amenity", "college", "college", 35),
    ("amenity", "bus_station", "bus_station", 35),
    ("leisure", "stadium", "stadium", 35),
]

HISTORIC_SKIP = {"memorial", "wayside_cross", "wayside_shrine", "milestone", "boundary_stone", "yes", "district_marker"}
NATURE = {"peak", "volcano", "glacier", "beach", "valley", "cave_entrance", "cliff", "hot_spring", "spring"}
WORSHIP_BUILDINGS = {"mosque", "temple", "church", "gurdwara", "shrine", "cathedral"}

# Base alert radius (metres) added to an area's own size, and the cap.
RADIUS_RULES = {
    "museum": (120, 1500), "historical": (200, 2500), "religious": (200, 2000),
    "attraction": (250, 2500), "park": (150, 2500), "viewpoint": (300, 1500),
    "cultural": (150, 1500), "shopping": (200, 1500), "nature": (500, 5000),
}
POINT_RADIUS = {"peak": 3000, "volcano": 3000, "glacier": 3000, "waterfall": 600, "valley": 3000}


def place_kind(tags: dict) -> tuple[str, int] | None:
    """Kind and base rank for a searchable place, or None."""
    p = tags.get("place")
    if p in PLACE_RANK and tags.get("name"):
        rank = PLACE_RANK[p]
        try:
            pop = int(re.sub(r"[^0-9]", "", tags.get("population", "")) or 0)
        except ValueError:
            pop = 0
        if pop:
            rank = min(100, rank + int(math.log10(pop) * 2))
        return p, rank
    for key, value, kind, rank in POI_KINDS:
        if tags.get(key) == value and tags.get("name"):
            if kind == "airport" and not (tags.get("iata") or tags.get("icao")):
                return None
            return kind, rank
    return None


def landmark_category(tags: dict) -> str | None:
    """Destination category for a landmark candidate, or None."""
    tourism = tags.get("tourism")
    historic = tags.get("historic")
    natural = tags.get("natural")
    if tourism == "museum":
        return "museum"
    if tourism == "viewpoint":
        return "viewpoint"
    if (
        natural in NATURE
        or tags.get("waterway") == "waterfall"
        or (natural == "water" and tags.get("water") in ("lake", "reservoir"))
        or tags.get("boundary") in ("national_park", "protected_area")
        or tags.get("leisure") == "nature_reserve"
    ):
        return "nature"
    if tags.get("amenity") == "place_of_worship" or tags.get("building") in WORSHIP_BUILDINGS or historic == "shrine":
        return "religious"
    if historic and historic not in HISTORIC_SKIP:
        return "historical"
    if tags.get("leisure") in ("park", "garden"):
        return "park"
    if tourism in ("attraction", "zoo", "theme_park", "aquarium"):
        return "attraction"
    if tourism == "gallery" or tags.get("amenity") in ("arts_centre", "theatre"):
        return "cultural"
    if tags.get("amenity") == "marketplace":
        return "shopping"
    return None


def is_famous(tags: dict, category: str) -> bool:
    """Famous = has a Wikidata/Wikipedia entry. Named museums and viewpoints
    are kept even without one: they are few and always worth an alert."""
    if tags.get("wikidata") or tags.get("wikipedia"):
        return True
    return category in ("museum", "viewpoint") and bool(tags.get("name"))


def alert_radius(category: str, tags: dict, area_m2: float | None) -> int:
    base, cap = RADIUS_RULES[category]
    special = tags.get("natural") or tags.get("waterway")
    if area_m2 is None and special in POINT_RADIUS:
        return POINT_RADIUS[special]
    size = math.sqrt(area_m2 / math.pi) if area_m2 else 0
    return int(max(100, min(cap, size + base)))


def slugify(text: str, osm_id: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")[:60].strip("-")
    return f"{base}-{osm_id}" if base else f"landmark-{osm_id}"


def is_arabic_script(text: str) -> bool:
    return any("؀" <= ch <= "ۿ" for ch in text or "")


def names(tags: dict) -> tuple[str | None, str | None]:
    """(English-ish display name, Urdu name)."""
    name = tags.get("name:en") or tags.get("name")
    ur = tags.get("name:ur") or (tags.get("name") if is_arabic_script(tags.get("name", "")) else None)
    if name and is_arabic_script(name) and tags.get("int_name"):
        name = tags["int_name"]
    return name, ur


def area_m2(geom, lat: float) -> float:
    # Lon/lat degrees to square metres at this latitude (good enough for radii).
    return geom.area * (111_320 ** 2) * math.cos(math.radians(lat))


# ---------------------------------------------------------------------------
# OSM extraction
# ---------------------------------------------------------------------------


@dataclass
class Landmark:
    osm_id: str
    name: str
    name_ur: str | None
    category: str
    lat: float
    lon: float
    radius: int
    tags: dict
    wikidata: str | None = None
    wikipedia: str | None = None
    extra: dict = field(default_factory=dict)


class Extractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.wkb = osmium.geom.WKBFactory()
        self.places: list[dict] = []
        self.landmarks: list[Landmark] = []
        self.provinces: list[tuple[str, object]] = []
        self.districts: list[tuple[str, object]] = []
        self.country = None

    # Nodes ------------------------------------------------------------------
    def node(self, n):
        if not n.tags:
            return
        tags = dict(n.tags)
        self._consider(f"n{n.id}", tags, n.location.lat, n.location.lon, None)

    # Open ways (closed ways arrive as areas) --------------------------------
    def way(self, w):
        if not w.tags or w.is_closed():
            return
        tags = dict(w.tags)
        if not (place_kind(tags) or landmark_category(tags)):
            return
        try:
            line = shapely.wkb.loads(self.wkb.create_linestring(w), hex=True)
        except Exception:
            return
        mid = line.interpolate(0.5, normalized=True)
        self._consider(f"w{w.id}", tags, mid.y, mid.x, None)

    # Areas (closed ways and multipolygon/boundary relations) ----------------
    def area(self, a):
        tags = dict(a.tags)
        osm_id = f"{'w' if a.from_way() else 'r'}{a.orig_id()}"
        is_admin = tags.get("boundary") == "administrative"
        wanted = is_admin or place_kind(tags) or landmark_category(tags)
        if not wanted:
            return
        try:
            geom = shapely.wkb.loads(self.wkb.create_multipolygon(a), hex=True)
        except Exception:
            return
        if is_admin:
            level = tags.get("admin_level")
            label = tags.get("name:en") or tags.get("name")
            if level == "2" and tags.get("ISO3166-1") == "PK":
                self.country = geom
            elif level == "4" and label:
                self.provinces.append((label, geom))
            elif level == "6" and label:
                self.districts.append((label, geom))
            return
        pt = geom.representative_point()
        self._consider(osm_id, tags, pt.y, pt.x, area_m2(geom, pt.y))

    # ------------------------------------------------------------------------
    def _consider(self, osm_id, tags, lat, lon, area):
        pk = place_kind(tags)
        if pk:
            name, ur = names(tags)
            if name:
                self.places.append({"id": osm_id, "name": name, "name_ur": ur, "kind": pk[0], "rank": pk[1], "lat": lat, "lon": lon})
        cat = landmark_category(tags)
        if cat and is_famous(tags, cat):
            name, ur = names(tags)
            if name:
                self.landmarks.append(
                    Landmark(osm_id, name, ur, cat, lat, lon, alert_radius(cat, tags, area), tags,
                             tags.get("wikidata"), tags.get("wikipedia"))
                )


def in_bbox(lat, lon):
    return PAKISTAN_BBOX[1] <= lat <= PAKISTAN_BBOX[3] and PAKISTAN_BBOX[0] <= lon <= PAKISTAN_BBOX[2]


class AdminLookup:
    """Point-in-polygon lookup for province and district names."""

    def __init__(self, provinces, districts, country):
        self.country = country
        self._prov = provinces
        self._dist = districts
        self._ptree = STRtree([g for _, g in provinces]) if provinces else None
        self._dtree = STRtree([g for _, g in districts]) if districts else None

    def _find(self, tree, items, pt):
        if tree is None:
            return None
        for idx in tree.query(pt, predicate="intersects"):
            return items[int(idx)][0]
        return None

    def lookup(self, lat, lon):
        pt = Point(lon, lat)
        inside = self.country.intersects(pt) if self.country is not None else in_bbox(lat, lon)
        return inside, self._find(self._ptree, self._prov, pt), self._find(self._dtree, self._dist, pt)


def dedupe_places(places):
    """Same name and kind within ~2 km: keep the node (or the higher rank)."""
    seen = {}
    out = []
    for p in sorted(places, key=lambda p: (p["id"][0] != "n", -p["rank"])):
        key = (p["name"].lower(), p["kind"], round(p["lat"] / 0.02), round(p["lon"] / 0.02))
        if key in seen:
            continue
        seen[key] = True
        out.append(p)
    return out


def dedupe_landmarks(landmarks):
    """One row per Wikidata item (prefer areas, they have better radii)."""
    by_key = {}
    for lm in landmarks:
        key = lm.wikidata or f"{lm.name.lower()}|{round(lm.lat, 3)}|{round(lm.lon, 3)}"
        cur = by_key.get(key)
        if cur is None or (cur.osm_id.startswith("n") and not lm.osm_id.startswith("n")):
            by_key[key] = lm
    return list(by_key.values())


def nearest_city(lat, lon, cities):
    best, best_d = None, 30_000.0
    for c in cities:
        d = haversine(lat, lon, c["lat"], c["lon"])
        if d < best_d:
            best, best_d = c["name"], d
    return best


def haversine(lat1, lon1, lat2, lon2):
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# Enrichment: Wikidata, Commons, Wikipedia
# ---------------------------------------------------------------------------


def http_json(session, url, params=None, tries=5):
    for attempt in range(tries):
        try:
            res = session.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=40)
            if res.status_code == 404:
                return None
            if res.status_code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt * 2)
                continue
            res.raise_for_status()
            return res.json()
        except Exception:
            if attempt == tries - 1:
                return None
            time.sleep(2 ** attempt * 2)
    return None


def chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def parse_wikidata(entities: dict) -> dict:
    out = {}
    for qid, e in entities.items():
        if "missing" in e:
            continue
        claims = e.get("claims", {})
        image = None
        for c in claims.get("P18", []):
            image = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if image:
                break
        sitelinks = e.get("sitelinks", {})
        info = {
            "label_en": e.get("labels", {}).get("en", {}).get("value"),
            "label_ur": e.get("labels", {}).get("ur", {}).get("value"),
            "description": e.get("descriptions", {}).get("en", {}).get("value"),
            "description_ur": e.get("descriptions", {}).get("ur", {}).get("value"),
            "image": image,
            "enwiki": sitelinks.get("enwiki", {}).get("title"),
            "urwiki": sitelinks.get("urwiki", {}).get("title"),
            "sitelinks": len(sitelinks),
        }
        out[qid] = info
        if e.get("id") and e["id"] != qid:
            out[e["id"]] = info
    return out


def fetch_wikidata(session, qids):
    result = {}
    for batch in chunks(sorted(set(qids)), 50):
        data = http_json(session, "https://www.wikidata.org/w/api.php", {
            "action": "wbgetentities", "ids": "|".join(batch), "format": "json",
            "props": "labels|descriptions|claims|sitelinks", "languages": "en|ur",
        })
        if data and "entities" in data:
            parsed = parse_wikidata(data["entities"])
            # Redirected ids come back under the target id; map requested ids too.
            for q in batch:
                if q in parsed:
                    result[q] = parsed[q]
            for k, v in parsed.items():
                result.setdefault(k, v)
    return result


def strip_html(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip() or None


def parse_commons(data: dict) -> dict:
    out = {}
    query = data.get("query", {})
    alias = {n["to"]: n["from"] for n in query.get("normalized", [])}
    for page in query.get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        meta = info.get("extmetadata", {})
        title = page.get("title")
        record = {
            "url": info.get("thumburl") or info.get("url"),
            "page": info.get("descriptionurl"),
            "credit": strip_html(meta.get("Artist", {}).get("value")),
            "license": strip_html(meta.get("LicenseShortName", {}).get("value")),
        }
        out[title] = record
        if title in alias:
            out[alias[title]] = record
    return out


def fetch_commons(session, filenames):
    result = {}
    titles = sorted({f"File:{f}" for f in filenames if f})
    for batch in chunks(titles, 50):
        data = http_json(session, "https://commons.wikimedia.org/w/api.php", {
            "action": "query", "format": "json", "prop": "imageinfo", "titles": "|".join(batch),
            "iiprop": "url|extmetadata", "iiurlwidth": "1024", "iiextmetadatafilter": "Artist|LicenseShortName",
        })
        if data:
            result.update(parse_commons(data))
    return result


def fetch_summary(session, title, lang="en"):
    data = http_json(session, f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(title.replace(' ', '_'), safe='')}")
    if not data or data.get("type") == "disambiguation":
        return None
    return {
        "extract": data.get("extract"),
        "description": data.get("description"),
        "url": data.get("content_urls", {}).get("desktop", {}).get("page"),
    }


def first_sentence(text, limit=160):
    if not text:
        return None
    sentence = re.split(r"(?<=[.!?])\s", text.strip(), maxsplit=1)[0]
    return sentence if len(sentence) <= limit else sentence[: limit - 1].rsplit(" ", 1)[0] + "…"


def capitalize(text):
    return text[:1].upper() + text[1:] if text else text


CATEGORY_LABEL = {
    "historical": "Historic site", "religious": "Place of worship", "museum": "Museum",
    "viewpoint": "Viewpoint", "nature": "Natural landmark", "park": "Park",
    "attraction": "Attraction", "cultural": "Cultural venue", "shopping": "Market",
}


def enrich(landmarks, session, workers=6):
    qids = [lm.wikidata for lm in landmarks if lm.wikidata and re.fullmatch(r"Q[0-9]+", lm.wikidata)]
    print(f"Wikidata: {len(set(qids))} items", flush=True)
    wd = fetch_wikidata(session, qids)

    files = [wd[lm.wikidata]["image"] for lm in landmarks if lm.wikidata in wd and wd[lm.wikidata]["image"]]
    print(f"Commons: {len(set(files))} images", flush=True)
    commons = fetch_commons(session, files)

    titles = {}
    for lm in landmarks:
        title = None
        if lm.wikidata in wd and wd[lm.wikidata]["enwiki"]:
            title = wd[lm.wikidata]["enwiki"]
        elif lm.wikipedia and lm.wikipedia.startswith("en:"):
            title = lm.wikipedia[3:]
        if title:
            titles[lm.osm_id] = title
    print(f"Wikipedia: {len(titles)} summaries", flush=True)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        summaries = dict(zip(titles.keys(), pool.map(lambda t: fetch_summary(session, t), titles.values())))

    ur_titles = {lm.osm_id: wd[lm.wikidata]["urwiki"] for lm in landmarks if lm.wikidata in wd and wd[lm.wikidata].get("urwiki")}
    print(f"Urdu Wikipedia: {len(ur_titles)} summaries", flush=True)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        ur_summaries = dict(zip(ur_titles.keys(), pool.map(lambda t: fetch_summary(session, t, "ur"), ur_titles.values())))

    for lm in landmarks:
        info = wd.get(lm.wikidata or "", {})
        summary = summaries.get(lm.osm_id) or {}
        if info.get("label_en") and is_arabic_script(lm.name):
            lm.name = info["label_en"]
        lm.name_ur = lm.name_ur or info.get("label_ur")
        image = commons.get(f"File:{info['image']}") if info.get("image") else None
        lm.extra = {
            "short": capitalize(info.get("description")) or first_sentence(summary.get("extract")),
            "description": (summary.get("extract") or "")[:1500] or None,
            "wikipedia_url": summary.get("url"),
            "image": image,
            "sitelinks": info.get("sitelinks", 0),
            "short_ur": info.get("description_ur") or first_sentence((ur_summaries.get(lm.osm_id) or {}).get("extract")),
            "description_ur": ((ur_summaries.get(lm.osm_id) or {}).get("extract") or "")[:1500] or None,
        }


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

PLACE_COLUMNS = ["id", "name", "name_ur", "kind", "district", "province", "latitude", "longitude", "rank"]
LANDMARK_COLUMNS = [
    "osm_id", "slug", "name", "name_ur", "category", "city", "region", "latitude", "longitude", "radius_m",
    "short_description", "description", "image_url", "image_credit", "image_license", "image_page_url",
    "wikidata", "wikipedia_url", "popularity", "short_description_ur", "description_ur",
]


def landmark_rows(landmarks, admin, cities):
    for lm in landmarks:
        inside, province, district = admin.lookup(lm.lat, lm.lon)
        if not inside:
            continue
        city = nearest_city(lm.lat, lm.lon, cities) or district or province or "Pakistan"
        extra = lm.extra or {}
        image = extra.get("image") or {}
        short = extra.get("short") or f"{CATEGORY_LABEL[lm.category]} in {city}"
        sitelinks = extra.get("sitelinks", 0) or 0
        yield {
            "osm_id": lm.osm_id,
            "slug": slugify(lm.name, lm.osm_id),
            "name": lm.name[:200],
            "name_ur": lm.name_ur,
            "category": lm.category,
            "city": city,
            "region": province or "Pakistan",
            "latitude": round(lm.lat, 6),
            "longitude": round(lm.lon, 6),
            "radius_m": lm.radius,
            "short_description": short[:300],
            "description": extra.get("description"),
            "image_url": image.get("url"),
            "image_credit": (image.get("credit") or "")[:300] or None,
            "image_license": image.get("license"),
            "image_page_url": image.get("page"),
            "wikidata": lm.wikidata,
            "wikipedia_url": extra.get("wikipedia_url"),
            "popularity": min(90, 30 + sitelinks * 2) if lm.wikidata else 25,
            "short_description_ur": (extra.get("short_ur") or "")[:300] or None,
            "description_ur": extra.get("description_ur"),
        }


def place_rows(places, admin):
    for p in places:
        inside, province, district = admin.lookup(p["lat"], p["lon"])
        if not inside:
            continue
        yield {
            "id": p["id"], "name": p["name"][:200], "name_ur": p["name_ur"], "kind": p["kind"],
            "district": district, "province": province,
            "latitude": round(p["lat"], 6), "longitude": round(p["lon"], 6), "rank": p["rank"],
        }


def write_csv(path, columns, rows):
    count = 0
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: ("" if v is None else v) for k, v in row.items()})
            count += 1
    return count


def run(pbf, out_dir, do_enrich=True, session=None):
    os.makedirs(out_dir, exist_ok=True)
    ex = Extractor()
    ex.apply_file(pbf, locations=True, idx="flex_mem")
    print(f"OSM: {len(ex.places)} places, {len(ex.landmarks)} landmark candidates, "
          f"{len(ex.provinces)} provinces, {len(ex.districts)} districts, country={'yes' if ex.country is not None else 'no'}",
          flush=True)
    admin = AdminLookup(ex.provinces, ex.districts, ex.country)
    places = dedupe_places(ex.places)
    landmarks = dedupe_landmarks(ex.landmarks)
    if do_enrich:
        if session is None:
            import requests
            session = requests.Session()
        enrich(landmarks, session)
    cities = [p for p in places if p["kind"] in ("city", "town")]
    n_places = write_csv(os.path.join(out_dir, "places.csv"), PLACE_COLUMNS, place_rows(places, admin))
    n_landmarks = write_csv(os.path.join(out_dir, "landmarks.csv"), LANDMARK_COLUMNS, landmark_rows(landmarks, admin, cities))
    print(f"Wrote {n_places} places and {n_landmarks} landmarks to {out_dir}", flush=True)
    return n_places, n_landmarks


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        raise SystemExit(__doc__)
    run(args[0], args[1], do_enrich="--no-enrich" not in sys.argv)
