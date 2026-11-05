"""Tests for scripts/make-water-polygons.py (run: python -m unittest discover scripts/tests)."""

import importlib.util
import os
import tempfile
import unittest
import zipfile

import shapefile
from shapely.geometry import LineString, Point

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location("make_water", os.path.join(HERE, "..", "make-water-polygons.py"))
mw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mw)


def fake_coast():
    """A simplified Pakistan coast running west to east across the sea box, land to the north."""
    return [
        LineString([(61.4, 25.15), (62.33, 25.10), (63.5, 25.20), (64.6, 25.15), (66.6, 25.40)]),
        LineString([(66.6, 25.40), (66.95, 24.85), (67.02, 24.80), (67.3, 24.70), (68.0, 24.20), (68.5, 23.70)]),
    ]


class WaterPolygonsTest(unittest.TestCase):
    def test_sea_is_south_of_the_coast(self):
        water = mw.build_water(fake_coast(), (61.55, 21.5, 68.3, 26.2))
        self.assertTrue(water.contains(Point(66.9, 24.7)))
        self.assertFalse(water.contains(Point(67.03, 24.86)))  # Karachi, Saddar

    def test_zip_is_lon_lat_with_matching_prj(self):
        water = mw.build_water(fake_coast(), (61.55, 21.5, 68.3, 26.2))
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "water.zip")
            mw.write_zip(water, out)
            with zipfile.ZipFile(out) as z:
                names = z.namelist()
                self.assertIn("water-polygons-split-3857/water_polygons.shp", names)
                prj = z.read("water-polygons-split-3857/water_polygons.prj").decode()
                z.extractall(tmp)
            # Geographic WGS 84, not a projected (Mercator) system.
            self.assertTrue(prj.startswith("GEOGCS["))
            self.assertNotIn("PROJCS", prj)
            reader = shapefile.Reader(os.path.join(tmp, "water-polygons-split-3857", "water_polygons"))
            xmin, ymin, xmax, ymax = reader.bbox
            # Coordinates are degrees inside the sea box (Mercator metres would be millions).
            self.assertGreaterEqual(xmin, 61.5)
            self.assertLessEqual(xmax, 68.4)
            self.assertGreaterEqual(ymin, 21.4)
            self.assertLessEqual(ymax, 26.3)


if __name__ == "__main__":
    unittest.main()
