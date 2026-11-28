#!/usr/bin/env bash
# Trim leading/trailing silence from voice clips in place, so each phrase
# lands exactly on its beat; writes durations.json next to them.
#   scripts/trim-voice.sh public/voice-hype
set -euo pipefail
dir="$1"; mkdir -p "$dir/.trim"
for f in "$dir"/*.mp3; do
  ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse" -c:a libmp3lame -b:a 160k "$dir/.trim/$(basename "$f")"
done
mv "$dir"/.trim/*.mp3 "$dir"/ && rmdir "$dir/.trim"
python3 - "$dir" <<'PY'
import glob, json, os, subprocess, sys
d = sys.argv[1]
out = {os.path.basename(f)[:-4]: round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode()), 3) for f in sorted(glob.glob(f"{d}/*.mp3"))}
json.dump(out, open(f"{d}/durations.json", "w"), indent=1)
print(out)
PY
