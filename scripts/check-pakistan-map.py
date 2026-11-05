"""Checks a built Pakistan .pmtiles file before it is published.

Reads the finished tiles, so it catches problems from any stage of the build
(for example the sea drawn in the wrong place). For each known point it looks
at the "ocean" polygons in the zoom-12 tile there:

  - land points (city centres near the coast) must not be inside the ocean;
  - sea points (open water off the coast) must be.

Points outside the file's bounds are skipped, so the same checks run on the
small Karachi test file.

Usage: python check-pakistan-map.py <file.pmtiles> [<file.pmtiles> ...]
"""

import gzip
import math
import sys

import mapbox_vector_tile
from pmtiles.reader import MmapSource, Reader
from shapely.geometry import Point, shape

ZOOM = 12
EXTENT = 4096

LAND = {
    "Karachi, Saddar": (67.030, 24.860),
    "Karachi, Gulshan-e-Iqbal": (67.090, 24.920),
    "Karachi, Clifton": (67.030, 24.815),
    "Hub": (66.820, 25.040),
    "Gwadar airport": (62.330, 25.230),
    "Pasni": (63.480, 25.300),
    "Thatta": (67.920, 24.750),
}
SEA = {
    "Arabian Sea off Karachi": (66.900, 24.700),
    "Arabian Sea off Ormara": (64.600, 24.900),
    "Arabian Sea off Gwadar": (62.400, 24.950),
}


def tile_position(lon: float, lat: float, z: int):
    n = 2**z
    fx = (lon + 180) / 360 * n
    fy = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    x, y = int(fx), int(fy)
    # mapbox_vector_tile decodes with y pointing up (origin bottom-left).
    return x, y, Point((fx - x) * EXTENT, (1 - (fy - y)) * EXTENT)


def in_ocean(reader: Reader, lon: float, lat: float):
    """True/False, or None when the file has no tile there."""
    x, y, point = tile_position(lon, lat, ZOOM)
    data = reader.get(ZOOM, x, y)
    if not data:
        return None
    try:
        data = gzip.decompress(data)
    except OSError:
        pass
    tile = mapbox_vector_tile.decode(data)
    for feature in tile.get("water", {}).get("features", []):
        if feature["properties"].get("class") != "ocean":
            continue
        if feature["geometry"]["type"] in ("Polygon", "MultiPolygon") and shape(feature["geometry"]).buffer(0).contains(point):
            return True
    return False


def check(path: str) -> list[str]:
    failures = []
    with open(path, "rb") as f:
        reader = Reader(MmapSource(f))
        header = reader.header()
        bounds = (header["min_lon_e7"] / 1e7, header["min_lat_e7"] / 1e7, header["max_lon_e7"] / 1e7, header["max_lat_e7"] / 1e7)

        def inside(lon, lat):
            return bounds[0] <= lon <= bounds[2] and bounds[1] <= lat <= bounds[3]

        checked = 0
        for points, want_sea in ((LAND, False), (SEA, True)):
            for name, (lon, lat) in points.items():
                if not inside(lon, lat):
                    continue
                result = in_ocean(reader, lon, lat)
                if result is None:
                    continue
                checked += 1
                ok = result == want_sea
                print(f"  {'ok ' if ok else 'BAD'} {name}: {'sea' if result else 'land'}")
                if not ok:
                    failures.append(f"{path}: {name} ({lon}, {lat}) is {'sea' if result else 'land'}")
        if checked == 0:
            print("  (no check points inside this file)")
    return failures


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    failures = []
    for path in sys.argv[1:]:
        print(path)
        failures += check(path)
    if failures:
        raise SystemExit("Map check failed:\n" + "\n".join(failures))
    print("Map check passed.")


if __name__ == "__main__":
    main()
