#!/usr/bin/env bash
# Normalise loudness without re-encoding the picture, and report the result.
#   scripts/finalize.sh out/film.mp4 out/film-final.mp4 -16   # web / YouTube
#   scripts/finalize.sh out/hype.mp4 out/hype-final.mp4 -14   # Reels / TikTok
set -euo pipefail
in="$1"; out="$2"; lufs="${3:--16}"
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=${lufs}:TP=-1.0:LRA=10" -c:a aac -b:a 192k -ar 48000 "$out"
echo "$out $(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$out") $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")s $(du -h "$out" | cut -f1)"
ffmpeg -v info -i "$out" -af ebur128=framelog=quiet -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1
