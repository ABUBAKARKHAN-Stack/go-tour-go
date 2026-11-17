import urllib.request
import json
import urllib.parse
import re

places = [
    ("frere-hall", "Frere Hall"),
    ("mohatta-palace", "Mohatta Palace"),
    ("mazar-e-quaid", "Mazar-e-Quaid"),
    ("empress-market", "Empress Market"),
    ("wazir-mansion", "Wazir Mansion"),
    ("flagstaff-house", "Flagstaff House"),
    ("merewether-tower", "Merewether Clock Tower"),
    ("kpt-building", "Karachi Port Trust Building"),
    ("denso-hall", "Denso Hall"),
    ("hindu-gymkhana", "Hindu Gymkhana"),
    ("kmc-building", "Karachi Municipal Corporation Building"),
    ("st-patricks", "St. Patrick's Cathedral, Karachi"),
    ("holy-trinity", "Holy Trinity Cathedral, Karachi"),
    ("habib-bank-plaza", "Habib Bank Plaza"),
    ("clifton-beach", "Clifton Beach, Karachi"),
    ("manora-island", "Manora, Karachi"),
    ("hawksbay-beach", "Hawke's Bay, Karachi"),
    ("sandspit-beach", "Sandspit Beach"),
    ("cape-monze", "Cape Monze"),
    ("paradise-point", "Paradise Point, Pakistan"),
    ("churna-island", "Churna Island"),
    ("port-grand", "Port Grand Food and Entertainment Complex"),
    ("paf-museum", "PAF Museum"),
    ("maritime-museum", "Pakistan Maritime Museum"),
    ("abdullah-shah-ghazi", "Abdullah Shah Ghazi"),
    ("bagh-ibne-qasim", "Bagh Ibne Qasim"),
    ("hill-park", "Hill Park, Karachi"),
    ("swaminarayan-temple", "Shri Swaminarayan Mandir, Karachi"),
    ("manghopir", "Manghopir"),
    ("masjid-e-tooba", "Masjid e Tooba"),
    ("kothari-parade", "Jehangir Kothari Parade"),
    ("sindh-high-court", "Sindh High Court")
]

def get_page_image_file(title):
    # Query pageimages from en.wikipedia.org
    params = {
        "action": "query",
        "titles": title,
        "prop": "pageimages|images",
        "piprop": "thumbnail",
        "pithumbsize": 1000,
        "format": "json"
    }
    url = f"https://en.wikipedia.org/w/api.php?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "GoTourGoApp/3.0 (info@gotourgo.pk)"})
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data["query"]["pages"]
            for k, v in pages.items():
                if "thumbnail" in v:
                    return v["thumbnail"]["source"]
                if "images" in v:
                    # Return first jpg image
                    for img in v["images"]:
                        ititle = img["title"]
                        if ititle.lower().endswith((".jpg", ".jpeg", ".png")) and not any(x in ititle.lower() for x in ["icon", "flag", "map", "logo", "stub"]):
                            return f"FILE:{ititle}"
    except Exception as e:
        return f"ERR:{e}"
    return None

for slug, title in places:
    res = get_page_image_file(title)
    print(f"{slug:25s} -> {str(res)[:80]}")
