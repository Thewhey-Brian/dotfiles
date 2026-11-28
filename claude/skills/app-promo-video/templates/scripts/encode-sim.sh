#!/usr/bin/env bash
# Encode a raw simulator capture for Remotion: crop the status bar (time,
# recording dot, notification banners), 720 wide, 30 fps, H.264, no audio.
# The crop assumes an iPhone Pro Max capture (1320×2868); adjust for others.
#   scripts/encode-sim.sh raw/home.mov public/footage/sim-home.mp4
set -euo pipefail
ffmpeg -v error -y -i "$1" -vf "crop=iw:ih-190:0:190,scale=720:-2:flags=lanczos,fps=30" -an \
  -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p -movflags +faststart "$2"
echo "$2 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$2")s"
