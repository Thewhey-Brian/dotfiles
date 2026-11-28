"""Find CC0 / public-domain photos on Openverse and review them as sheets.

    python3 scripts/openverse.py search "city night street" "portrait woman"   # → ov/<query>.jpg sheets
    python3 scripts/openverse.py get "city night street" 8 neon-street           # download pick #8 → public/photos/

Only cc0/pdm, photographs, large. Unsplash's API sits behind a bot check —
don't work around it. Downloads are recorded in public/photos/CREDITS.json.
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

UA = {"User-Agent": "promo-video/1.0"}
CANDS = "ov/cands.json"
os.makedirs("ov", exist_ok=True)


def fetch(u, timeout=60):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout).read()


cmd, *args = sys.argv[1:]
cands = json.load(open(CANDS)) if os.path.exists(CANDS) else {}
if cmd == "search":
    for q in args:
        u = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
            dict(q=q, license="cc0,pdm", category="photograph", size="large", page_size=20, mature="false"))
        res = [r for r in json.loads(fetch(u))["results"] if (r.get("width") or 0) >= 1200]
        cands[q] = [dict(url=r["url"], thumb=r.get("thumbnail"), lic=r["license"], src=r.get("source"),
                         title=r.get("title"), creator=r.get("creator"), landing=r.get("foreign_landing_url")) for r in res]
        W, H, cols = 300, 220, 5
        sheet = Image.new("RGB", (cols * W, ((len(res) + cols - 1) // cols) * H), "white")
        d = ImageDraw.Draw(sheet)
        for i, r in enumerate(cands[q]):
            try:
                im = Image.open(io.BytesIO(fetch(r["thumb"], 30))).convert("RGB")
                im.thumbnail((W - 6, H - 6))
                sheet.paste(im, ((i % cols) * W + 3, (i // cols) * H + 3))
            except Exception:
                pass
            d.rectangle([(i % cols) * W + 3, (i // cols) * H + 3, (i % cols) * W + 40, (i // cols) * H + 30], fill="black")
            d.text(((i % cols) * W + 9, (i // cols) * H + 7), str(i), fill="yellow")
        sheet.save(f"ov/{q.replace(' ', '_')}.jpg", quality=80)
        print(q, len(res), f"→ ov/{q.replace(' ', '_')}.jpg")
    json.dump(cands, open(CANDS, "w"), indent=1)
elif cmd == "get":
    q, i, name = args[0], int(args[1]), args[2]
    r = cands[q][i]
    os.makedirs("public/photos", exist_ok=True)
    im = Image.open(io.BytesIO(fetch(r["url"], 90))).convert("RGB")
    im.thumbnail((2400, 2400))
    im.save(f"public/photos/{name}.jpg", quality=90)
    cred_path = "public/photos/CREDITS.json"
    cred = json.load(open(cred_path)) if os.path.exists(cred_path) else []
    cred = [c for c in cred if c["file"] != f"{name}.jpg"] + [dict(file=f"{name}.jpg", **{k: r[k] for k in ("title", "creator", "lic", "src", "landing", "url")})]
    json.dump(cred, open(cred_path, "w"), indent=1)
    print(name, im.size, r["lic"], r["src"])
