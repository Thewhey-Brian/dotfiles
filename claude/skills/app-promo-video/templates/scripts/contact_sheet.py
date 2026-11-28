"""Tile stills, or sample a video, into one review image.

    python3 scripts/contact_sheet.py sheet.jpg out/stills/*.png
    python3 scripts/contact_sheet.py sheet.jpg out/film.mp4 [frames=24]
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image

out, *src = sys.argv[1:]
paths = src
if len(src) >= 1 and src[0].lower().endswith((".mp4", ".mov")):
    n = int(src[1]) if len(src) > 1 else 24
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src[0]]).decode())
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src[0], "-vf", f"fps={n}/{dur}", f"{tmp}/f%03d.jpg"], check=True)
    paths = sorted(os.path.join(tmp, f) for f in os.listdir(tmp))

ims = [Image.open(p).convert("RGB") for p in paths]
cw = 360
ims = [im.resize((cw, round(im.height * cw / im.width))) for im in ims]
ch = max(im.height for im in ims)
cols = min(len(ims), 8 if ch > cw else 6)
rows = math.ceil(len(ims) / cols)
sheet = Image.new("RGB", (cols * cw, rows * ch), "black")
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * cw, (i // cols) * ch))
sheet.save(out, quality=82)
print(out, sheet.size)
