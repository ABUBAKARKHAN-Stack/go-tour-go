#!/usr/bin/env bash
# Builds the offline map files for GoTourGo from OpenStreetMap (OpenMapTiles schema,
# the same schema as the OpenFreeMap style the app uses online).
#
#   pakistan.pmtiles      all of Pakistan, street level (zoom 0-14)
#   karachi-test.pmtiles  a small Karachi extract used by the in-app map engine test
#   manifest.json         sizes and checksums the app reads before downloading
#
# Needs Java 21+ and about 12 GB of free disk. Output lands in map-build/out/.
# Runs in GitHub Actions
# (.github/workflows/build-pakistan-map.yml) or on any laptop:
#   bash scripts/build-pakistan-map.sh
set -euo pipefail

# Everything is built inside map-build/, which ignores itself so the large
# downloads and outputs are never committed by accident.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${WORK_DIR:-map-build}"
mkdir -p "$WORK" && printf '*\n' > "$WORK/.gitignore"
cd "$WORK"
OUT="${OUT_DIR:-out}"
PLANETILER_URL="${PLANETILER_URL:-https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar}"
MAXZOOM="${MAXZOOM:-14}"
mkdir -p "$OUT" data

SRC=data/sources
mkdir -p "$SRC"

# Download with retries and long timeouts. Planetiler's own downloader gives up
# after a short timeout when a mirror is slow (seen with osmdata.openstreetmap.de),
# so every source is fetched here and handed to Planetiler as a local path.
fetch() {
  local url="$1" dest="$2"
  if [ -s "$dest" ]; then echo "Using cached $dest"; return; fi
  echo "Downloading $url"
  curl -fL --retry 8 --retry-delay 20 --retry-all-errors \
    --connect-timeout 60 --max-time 3600 -C - -o "$dest.part" "$url"
  mv "$dest.part" "$dest"
}

fetch "$PLANETILER_URL" planetiler.jar
fetch "https://download.geofabrik.de/asia/pakistan-latest.osm.pbf" "$SRC/pakistan.osm.pbf"

# Ocean polygons: the official file lives on osmdata.openstreetmap.de, which
# refuses connections from GitHub Actions runners. Try it briefly, then build an
# equivalent lon/lat file for Pakistan's coast from the coastline in the
# extract. The two files have different names so a cached one is never mistaken
# for the other.
python3 -m venv .venv-tools
.venv-tools/bin/pip install --quiet osmium shapely pyshp pmtiles mapbox-vector-tile
OFFICIAL_WATER="$SRC/water-polygons-split-3857.official.zip"
COAST_WATER="$SRC/water-polygons-pakistan-4326.zip"
if [ -s "$OFFICIAL_WATER" ]; then
  WATER="$OFFICIAL_WATER"
elif curl -4 -fL --retry 1 --connect-timeout 20 --max-time 1800 -o "$OFFICIAL_WATER.part" \
    "https://osmdata.openstreetmap.de/download/water-polygons-split-3857.zip"; then
  mv "$OFFICIAL_WATER.part" "$OFFICIAL_WATER"
  WATER="$OFFICIAL_WATER"
else
  rm -f "$OFFICIAL_WATER.part"
  echo "osmdata.openstreetmap.de unreachable; building water polygons from the OSM coastline"
  if [ ! -s "$COAST_WATER" ]; then
    .venv-tools/bin/python "$SCRIPT_DIR/make-water-polygons.py" "$SRC/pakistan.osm.pbf" "$COAST_WATER.part"
    mv "$COAST_WATER.part" "$COAST_WATER"
  fi
  WATER="$COAST_WATER"
fi
fetch "https://naciscdn.org/naturalearth/packages/natural_earth_vector.sqlite.zip" "$SRC/natural_earth_vector.sqlite.zip"
fetch "https://github.com/acalcutt/osm-lakelines/releases/download/v12/lake_centerline.shp.zip" "$SRC/lake_centerline.shp.zip"
ls -lh "$SRC"

java -jar planetiler.jar --version || true

SOURCES=(
  --osm_path="$SRC/pakistan.osm.pbf"
  --water_polygons_path="$WATER"
  --natural_earth_path="$SRC/natural_earth_vector.sqlite.zip"
  --lake_centerlines_path="$SRC/lake_centerline.shp.zip"
)

# Full country, street level. No --download: everything above is local.
java -Xmx8g -jar planetiler.jar "${SOURCES[@]}" \
  --output="$OUT/pakistan.pmtiles" --force \
  --maxzoom="$MAXZOOM" --render_maxzoom="$MAXZOOM" \
  --nodemap-type=sparsearray --storage=mmap

# Small test extract (central Karachi) for the in-app map engine test.
java -Xmx4g -jar planetiler.jar "${SOURCES[@]}" \
  --bounds=66.95,24.80,67.15,24.97 \
  --output="$OUT/karachi-test.pmtiles" --force \
  --maxzoom="$MAXZOOM" --render_maxzoom="$MAXZOOM"

# Check the finished tiles (coast cities must be land, open water must be sea)
# before anything is published.
.venv-tools/bin/python "$SCRIPT_DIR/check-pakistan-map.py" "$OUT/pakistan.pmtiles" "$OUT/karachi-test.pmtiles"

python3 - "$OUT" <<'PY'
import hashlib, json, os, sys, datetime
out = sys.argv[1]
files = {}
for name in ("pakistan.pmtiles", "karachi-test.pmtiles"):
    path = os.path.join(out, name)
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    files[name] = {"bytes": os.path.getsize(path), "sha256": h.hexdigest()}
manifest = {
    "version": 1,
    "builtAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    "source": "OpenStreetMap contributors (ODbL), via Geofabrik; built with Planetiler",
    "schema": "openmaptiles",
    "maxzoom": int(os.environ.get("MAXZOOM", "14")),
    "files": files,
}
with open(os.path.join(out, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)
print(json.dumps(manifest, indent=2))
PY
