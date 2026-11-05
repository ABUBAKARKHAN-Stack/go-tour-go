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
WORK="${WORK_DIR:-map-build}"
mkdir -p "$WORK" && printf '*\n' > "$WORK/.gitignore"
cd "$WORK"
OUT="${OUT_DIR:-out}"
PLANETILER_URL="${PLANETILER_URL:-https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar}"
MAXZOOM="${MAXZOOM:-14}"
mkdir -p "$OUT" data

if [ ! -f planetiler.jar ]; then
  curl -fL --retry 3 -o planetiler.jar "$PLANETILER_URL"
fi
java -jar planetiler.jar --version || true

# Full country. --download fetches the Geofabrik Pakistan extract plus the
# water polygons and Natural Earth data Planetiler needs.
java -Xmx8g -jar planetiler.jar \
  --download --area=pakistan \
  --output="$OUT/pakistan.pmtiles" --force \
  --maxzoom="$MAXZOOM" --render_maxzoom="$MAXZOOM" \
  --nodemap-type=sparsearray --storage=mmap

# Small test extract (central Karachi) from the already-downloaded data.
java -Xmx4g -jar planetiler.jar \
  --area=pakistan --bounds=66.95,24.80,67.15,24.97 \
  --output="$OUT/karachi-test.pmtiles" --force \
  --maxzoom="$MAXZOOM" --render_maxzoom="$MAXZOOM"

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
