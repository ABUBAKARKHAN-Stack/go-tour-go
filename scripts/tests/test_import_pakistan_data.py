"""Tests for scripts/import_pakistan_data.py (run: python -m unittest discover scripts/tests)."""

import csv
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import import_pakistan_data as imp  # noqa: E402


def square(nid, wid, lon0, lat0, lon1, lat1):
    ids = list(range(nid, nid + 4))
    coords = [(lon0, lat0), (lon1, lat0), (lon1, lat1), (lon0, lat1)]
    nodes = [f'<node id="{i}" version="1" lat="{la}" lon="{lo}"/>' for i, (lo, la) in zip(ids, coords)]
    way = f'<way id="{wid}" version="1">' + "".join(f'<nd ref="{i}"/>' for i in ids + [ids[0]]) + "</way>"
    return nodes, way


def build_osm(path):
    xml = ['<?xml version="1.0"?>', '<osm version="0.6">']
    ways = []
    for spec in [(1, 1, 61, 24, 77, 37), (10, 2, 66, 24, 70, 28), (20, 3, 66.9, 24.7, 67.2, 25.0), (30, 4, 67.04, 24.86, 67.05, 24.87)]:
        n, w = square(*spec)
        xml += n
        ways.append(w)
    pts = [
        (100, 24.86, 67.01, {"place": "city", "name": "Karachi", "name:ur": "کراچی", "population": "14910352"}),
        (101, 24.835, 67.087, {"place": "neighbourhood", "name": "Qayyumabad", "name:ur": "قیوم آباد"}),
        (102, 24.8475, 67.0330, {"historic": "building", "name": "Frere Hall", "wikidata": "Q5502700"}),
        (103, 24.80, 67.05, {"tourism": "viewpoint", "name": "Sea View Point"}),
        (104, 24.81, 67.06, {"amenity": "place_of_worship", "religion": "muslim", "name": "Local Masjid"}),
        (105, 24.95, 67.15, {"natural": "peak", "name": "Test Peak", "wikipedia": "en:Test Peak"}),
        (106, 30.0, 79.5, {"place": "town", "name": "Outside Town"}),
        (107, 24.84, 67.08, {"amenity": "university", "name": "Test University"}),
        (108, 24.84, 67.09, {"aeroway": "aerodrome", "name": "Private Strip"}),
    ]
    for nid, lat, lon, tags in pts:
        xml.append(f'<node id="{nid}" version="1" lat="{lat}" lon="{lon}">' + "".join(f'<tag k="{k}" v="{v}"/>' for k, v in tags.items()) + "</node>")
    xml += ways[:3]
    xml.append(ways[3].replace("</way>", '<tag k="leisure" v="park"/><tag k="name" v="Hill Park"/><tag k="wikidata" v="Q999"/></way>'))
    rels = [
        (1, 1, {"type": "boundary", "boundary": "administrative", "admin_level": "2", "ISO3166-1": "PK", "name": "پاکستان", "name:en": "Pakistan"}),
        (2, 2, {"type": "boundary", "boundary": "administrative", "admin_level": "4", "name": "Sindh"}),
        (3, 3, {"type": "boundary", "boundary": "administrative", "admin_level": "6", "name": "Karachi South"}),
    ]
    for rid, wid, tags in rels:
        xml.append(f'<relation id="{rid}" version="1"><member type="way" ref="{wid}" role="outer"/>' + "".join(f'<tag k="{k}" v="{v}"/>' for k, v in tags.items()) + "</relation>")
    xml.append("</osm>")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(xml))


class FakeResponse:
    def __init__(self, data, status=200):
        self._data, self.status_code = data, status

    def json(self):
        return self._data

    def raise_for_status(self):
        pass


class FakeSession:
    def __init__(self):
        self.calls = []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(url)
        assert headers and "GoTourGo" in headers["User-Agent"]
        if "wikidata.org" in url:
            return FakeResponse({"entities": {
                "Q5502700": {
                    "id": "Q5502700",
                    "labels": {"en": {"value": "Frere Hall"}, "ur": {"value": "فریئر ہال"}},
                    "descriptions": {"en": {"value": "colonial-era building in Karachi, Pakistan"}, "ur": {"value": "کراچی میں نوآبادیاتی دور کی عمارت"}},
                    "claims": {"P18": [{"mainsnak": {"datavalue": {"value": "Frere Hall Karachi.jpg"}}}]},
                    "sitelinks": {"enwiki": {"title": "Frere Hall"}, "urwiki": {"title": "فریئر ہال"}, "dewiki": {"title": "y"}},
                },
                "Q999": {"id": "Q999", "missing": ""},
            }})
        if "commons.wikimedia.org" in url:
            return FakeResponse({"query": {
                "normalized": [{"from": "File:Frere Hall Karachi.jpg", "to": "File:Frere Hall Karachi.jpg"}],
                "pages": {"1": {"title": "File:Frere Hall Karachi.jpg", "imageinfo": [{
                    "thumburl": "https://upload.wikimedia.org/thumb/frere.jpg/1024px-frere.jpg",
                    "descriptionurl": "https://commons.wikimedia.org/wiki/File:Frere_Hall_Karachi.jpg",
                    "extmetadata": {"Artist": {"value": '<a href="x">Jane &amp; Co</a>'}, "LicenseShortName": {"value": "CC BY-SA 4.0"}},
                }]}},
            }})
        if "rest_v1/page/summary/Frere_Hall" in url:
            return FakeResponse({"type": "standard", "extract": "Frere Hall is a building in Karachi. It was built in 1865.",
                                 "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Frere_Hall"}}})
        if "ur.wikipedia.org" in url:
            return FakeResponse({"type": "standard", "extract": "فریئر ہال کراچی کی ایک تاریخی عمارت ہے۔ یہ 1865 میں بنی۔",
                                 "content_urls": {"desktop": {"page": "https://ur.wikipedia.org/wiki/x"}}})
        if "rest_v1/page/summary/Test_Peak" in url:
            return FakeResponse({"type": "standard", "extract": "Test Peak is a mountain.",
                                 "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Test_Peak"}}})
        return FakeResponse(None, 404)


class ClassificationTests(unittest.TestCase):
    def test_place_kinds(self):
        self.assertEqual(imp.place_kind({"place": "neighbourhood", "name": "Qayyumabad"}), ("neighbourhood", 50))
        self.assertGreater(imp.place_kind({"place": "city", "name": "K", "population": "14,910,352"})[1], 99)
        self.assertIsNone(imp.place_kind({"place": "neighbourhood"}))
        self.assertIsNone(imp.place_kind({"aeroway": "aerodrome", "name": "Strip"}))
        self.assertEqual(imp.place_kind({"aeroway": "aerodrome", "name": "JIAP", "iata": "KHI"})[0], "airport")

    def test_landmark_categories(self):
        self.assertEqual(imp.landmark_category({"tourism": "museum"}), "museum")
        self.assertEqual(imp.landmark_category({"natural": "water", "water": "lake"}), "nature")
        self.assertEqual(imp.landmark_category({"waterway": "waterfall"}), "nature")
        self.assertEqual(imp.landmark_category({"amenity": "place_of_worship"}), "religious")
        self.assertEqual(imp.landmark_category({"historic": "fort"}), "historical")
        self.assertIsNone(imp.landmark_category({"historic": "memorial"}))
        self.assertIsNone(imp.landmark_category({"amenity": "cafe"}))

    def test_famous_filter(self):
        self.assertTrue(imp.is_famous({"wikidata": "Q1"}, "religious"))
        self.assertFalse(imp.is_famous({"name": "Local Masjid"}, "religious"))
        self.assertTrue(imp.is_famous({"name": "Sea View"}, "viewpoint"))

    def test_radius(self):
        self.assertEqual(imp.alert_radius("nature", {"natural": "peak"}, None), 3000)
        self.assertEqual(imp.alert_radius("museum", {}, None), 120)
        big_lake = imp.alert_radius("nature", {"natural": "water"}, 50_000_000)
        self.assertTrue(3000 < big_lake <= 5000)
        self.assertLessEqual(imp.alert_radius("museum", {}, 10**9), 1500)

    def test_slug_and_names(self):
        self.assertEqual(imp.slugify("Frere Hall", "n102"), "frere-hall-n102")
        self.assertEqual(imp.slugify("قلعہ", "w5"), "landmark-w5")
        self.assertEqual(imp.names({"name": "قیوم آباد"}), ("قیوم آباد", "قیوم آباد"))
        self.assertEqual(imp.names({"name": "X", "name:en": "Y", "name:ur": "ز"}), ("Y", "ز"))


class PipelineTests(unittest.TestCase):
    def test_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            osm = os.path.join(tmp, "t.osm")
            build_osm(osm)
            session = FakeSession()
            n_places, n_landmarks = imp.run(osm, tmp, do_enrich=True, session=session)
            with open(os.path.join(tmp, "places.csv"), encoding="utf-8") as f:
                places = {r["name"]: r for r in csv.DictReader(f)}
            with open(os.path.join(tmp, "landmarks.csv"), encoding="utf-8") as f:
                landmarks = {r["name"]: r for r in csv.DictReader(f)}

        self.assertIn("Qayyumabad", places)
        self.assertEqual(places["Qayyumabad"]["province"], "Sindh")
        self.assertEqual(places["Qayyumabad"]["district"], "Karachi South")
        self.assertEqual(places["Qayyumabad"]["name_ur"], "قیوم آباد")
        self.assertIn("Test University", places)
        self.assertNotIn("Outside Town", places)
        self.assertNotIn("Private Strip", places)

        self.assertEqual(set(landmarks), {"Frere Hall", "Sea View Point", "Test Peak", "Hill Park"})
        frere = landmarks["Frere Hall"]
        self.assertEqual(frere["category"], "historical")
        self.assertEqual(frere["city"], "Karachi")
        self.assertEqual(frere["region"], "Sindh")
        self.assertEqual(frere["short_description"], "Colonial-era building in Karachi, Pakistan")
        self.assertTrue(frere["description"].startswith("Frere Hall is a building"))
        self.assertEqual(frere["image_credit"], "Jane & Co")
        self.assertEqual(frere["image_license"], "CC BY-SA 4.0")
        self.assertTrue(frere["image_url"].startswith("https://upload.wikimedia.org/"))
        self.assertEqual(frere["wikipedia_url"], "https://en.wikipedia.org/wiki/Frere_Hall")
        self.assertEqual(frere["name_ur"], "فریئر ہال")
        self.assertEqual(frere["slug"], "frere-hall-n102")
        self.assertEqual(int(frere["popularity"]), 36)
        self.assertEqual(frere["short_description_ur"], "کراچی میں نوآبادیاتی دور کی عمارت")
        self.assertTrue(frere["description_ur"].startswith("فریئر ہال کراچی"))
        self.assertEqual(landmarks["Test Peak"]["description_ur"], "")

        self.assertEqual(landmarks["Test Peak"]["radius_m"], "3000")
        self.assertEqual(landmarks["Test Peak"]["short_description"], "Test Peak is a mountain.")
        self.assertEqual(landmarks["Sea View Point"]["short_description"], "Viewpoint in Karachi")
        self.assertTrue(landmarks["Hill Park"]["osm_id"].startswith("w"))
        self.assertEqual(landmarks["Hill Park"]["category"], "park")
        self.assertGreaterEqual(n_places, 3)
        self.assertEqual(n_landmarks, 4)


if __name__ == "__main__":
    unittest.main()
