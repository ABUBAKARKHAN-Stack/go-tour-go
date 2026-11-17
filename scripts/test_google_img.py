import urllib.request
import urllib.parse
import re

query = "Frere Hall Karachi"
url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote(query)}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
        imgs = re.findall(r'https://encrypted-tbn0\.gstatic\.com/images\?q=[^"&]+', html)
        print("Found Google images:", len(imgs))
        if imgs:
            sample = imgs[0]
            print("Sample URL:", sample)
            with urllib.request.urlopen(sample) as sresp:
                print("Status:", sresp.status, "Type:", sresp.headers.get("content-type"), "Bytes:", len(sresp.read()))
except Exception as e:
    print("Error:", e)
