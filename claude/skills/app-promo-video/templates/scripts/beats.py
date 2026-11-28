"""Measure a music track for a beat-synced cut.

    python3 scripts/beats.py public/music/hype.mp3

Prints the tempo, detected beats, a steady grid fit (B0, PERIOD) for
src/beats.ts, an energy map in half-seconds (0–9; the drop is where it jumps,
a breakdown where it dips), and the biggest onsets. Writes <track>-beats.json.
Needs librosa (pip install librosa).
"""

import json
import sys

import librosa
import numpy as np

path = sys.argv[1]
y, sr = librosa.load(path, sr=22050)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
tempo = float(np.atleast_1d(tempo)[0])
beats = [float(b) for b in beats]

# Trackers lose the beat in quiet passages; fit a regular grid from the
# steady run of gaps instead of trusting every detection.
gaps = np.diff(beats)
period = float(np.median(gaps))
steady = [
    b
    for i, b in enumerate(beats[1:], 1)
    if abs(beats[i] - beats[i - 1] - period) < 0.05
]
b0 = beats[0]
if len(steady) > 4:
    n = round((steady[-1] - b0) / period)
    period = (steady[-1] - b0) / n

rms = librosa.feature.rms(y=y, hop_length=512)[0]
t = librosa.times_like(rms, sr=sr, hop_length=512)
dur = len(y) / sr
halves = np.arange(0, dur, 0.5)
energy = [
    float(np.mean(rms[(t >= a) & (t < a + 0.5)]))
    if np.any((t >= a) & (t < a + 0.5))
    else 0
    for a in halves
]
mx = max(energy) or 1

onset = librosa.onset.onset_strength(y=y, sr=sr)
ot = librosa.times_like(onset, sr=sr)
big = sorted(round(float(x), 2) for x in ot[np.argsort(onset)[-12:]])

print(f"tempo {tempo:.1f} BPM · {len(beats)} beats detected · duration {dur:.1f}s")
print(
    f"grid: B0 = {b0:.3f}, PERIOD = {period:.4f}  ({60 / period:.1f} BPM) → beat k at B0 + k·PERIOD"
)
print(
    "energy (t:0-9):",
    " ".join(f"{a:.1f}:{int(9 * e / mx)}" for a, e in zip(halves, energy)),
)
print("biggest onsets:", big)
for label, tt in [("beat of each big onset", big)]:
    print(label + ":", [round((x - b0) / period, 1) for x in tt])

json.dump(
    {"tempo": tempo, "B0": b0, "PERIOD": period, "beats": beats},
    open(path.rsplit(".", 1)[0] + "-beats.json", "w"),
    indent=1,
)
