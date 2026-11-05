"""Build ocean (water) polygons for Pakistan's coast from the OSM coastline.

Planetiler's OpenMapTiles profile draws the sea from the global
"water-polygons-split-3857" shapefile hosted on osmdata.openstreetmap.de.
When that host cannot be reached (it refuses connections from GitHub Actions
runners), this script makes an equivalent shapefile for the Arabian Sea off
Pakistan from the natural=coastline ways already inside the Pakistan extract.

How: the coastline lines are clipped to a box over Pakistan's sea, noded
together with the box outline and polygonised. The faces touching the box's
southern edge are open sea. Closed coastline rings (islands) are cut out.
The result is written as an EPSG:3857 polygon shapefile, zipped in the same
layout as the official file, so Planetiler reads it unchanged.

Usage: python make-water-polygons.py <pakistan.osm.pbf> <output.zip>
"""

import math
import os
import sys
import tempfile
import zipfile

import numpy as np
import osmium
import shapefile
import shapely
from shapely.geometry import LineString, Point, Polygon, box
from shapely.geometry.polygon import orient
from shapely.ops import linemerge, polygonize, unary_union

# Sea off Pakistan: from the Iran border (Gwadar Bay) to Sir Creek (India),
# south into the open Arabian Sea. Coastline crossing the box's east and west
# edges keeps the sea a single face.
SEA_BOX = (61.55, 21.5, 68.3, 26.2)  # min lon, min lat, max lon, max lat
# The extract's coastline may stop a little short of the borders, so narrower
# boxes are tried in turn; the first that passes the land/sea checks is used.
WEST_EDGES = (61.55, 61.7, 61.85)
EAST_EDGES = (68.3, 68.15, 68.0, 67.85)
EARTH_RADIUS = 6378137.0
# Inland points that must stay land. If the coastline has a gap, the whole box
# would become one "sea" face; these catch that instead of flooding the map.
LAND_CHECKS = [(65.0, 26.0), (63.0, 25.9), (67.1, 25.6), (66.0, 25.9)]
# Points well out at sea that must be water.
SEA_CHECKS = [(64.0, 22.5), (66.5, 23.0)]


class CoastlineHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.lines = []

    def way(self, w):
        if w.tags.get("natural") != "coastline":
            return
        try:
            coords = [(n.lon, n.lat) for n in w.nodes]
        except osmium.InvalidLocationError:
            return
        if len(coords) >= 2:
            self.lines.append(LineString(coords))


def to_mercator(coords):
    lon = np.radians(coords[:, 0])
    lat = np.radians(coords[:, 1])
    return np.column_stack([lon * EARTH_RADIUS, np.log(np.tan(math.pi / 4 + lat / 2)) * EARTH_RADIUS])


def build_water(lines, sea_box=SEA_BOX):
    area = box(*sea_box)
    south_edge = LineString([(sea_box[0], sea_box[1]), (sea_box[2], sea_box[1])])

    islands = []
    open_lines = []
    for line in lines:
        if line.is_closed and len(line.coords) >= 4:
            islands.append(Polygon(line.coords))
        else:
            open_lines.append(line)

    merged = linemerge(open_lines) if open_lines else None
    clipped = merged.intersection(area) if merged is not None else None
    parts = [area.boundary]
    if clipped is not None and not clipped.is_empty:
        parts.append(clipped)
    faces = list(polygonize(unary_union(parts)))
    sea_faces = [f for f in faces if f.intersects(south_edge) and f.intersection(south_edge).length > 0]
    if not sea_faces:
        raise ValueError("No open-sea face found: the coastline did not split the sea box.")
    water = unary_union(sea_faces)
    land_islands = unary_union([p.buffer(0) for p in islands if p.intersects(area)]) if islands else None
    if land_islands is not None and not land_islands.is_empty:
        water = water.difference(land_islands)
    flooded = [p for p in LAND_CHECKS if water.contains(Point(p))]
    dry = [p for p in SEA_CHECKS if not water.contains(Point(p))]
    if flooded or dry:
        raise ValueError(f"Coastline check failed (land marked as sea: {flooded}, sea missing: {dry}).")
    return water


def write_zip(water, out_zip):
    water_3857 = shapely.transform(water, to_mercator)
    polygons = list(getattr(water_3857, "geoms", [water_3857]))
    with tempfile.TemporaryDirectory() as tmp:
        folder = os.path.join(tmp, "water-polygons-split-3857")
        os.makedirs(folder)
        base = os.path.join(folder, "water_polygons")
        w = shapefile.Writer(base, shapeType=shapefile.POLYGON)
        w.field("x", "N", 10)
        w.field("y", "N", 10)
        for poly in polygons:
            if poly.is_empty or poly.geom_type != "Polygon":
                continue
            p = orient(poly, sign=-1.0)  # shapefile: exterior clockwise, holes counter-clockwise
            rings = [list(p.exterior.coords)] + [list(r.coords) for r in p.interiors]
            w.poly(rings)
            w.record(0, 0)
        w.close()
        with open(base + ".prj", "w") as prj:
            prj.write(
                'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],'
                'PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],'
                'PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1]]'
            )
        with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for name in os.listdir(folder):
                z.write(os.path.join(folder, name), f"water-polygons-split-3857/{name}")
    return len(polygons)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    pbf, out_zip = sys.argv[1], sys.argv[2]
    handler = CoastlineHandler()
    handler.apply_file(pbf, locations=True)
    print(f"Coastline ways: {len(handler.lines)}")
    water, errors = None, []
    for west in WEST_EDGES:
        for east in EAST_EDGES:
            sea_box = (west, SEA_BOX[1], east, SEA_BOX[3])
            try:
                water = build_water(handler.lines, sea_box)
                print(f"Sea box {sea_box} passed the checks.")
                break
            except ValueError as e:
                errors.append(f"{sea_box}: {e}")
        if water is not None:
            break
    if water is None:
        raise SystemExit("Could not build water polygons:\n" + "\n".join(errors))
    count = write_zip(water, out_zip)
    print(f"Wrote {count} water polygon(s), {water.area:.3f} square degrees, to {out_zip}")


if __name__ == "__main__":
    main()
