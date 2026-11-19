#!/usr/bin/env bash
# Turn the rendered frames into videos.
#   1. Blender -b wall-street-neon.blend -o //renders/frames/neon_#### -F PNG -a
#   2. ./encode.sh
set -euo pipefail
cd "$(dirname "$0")"
F=renders/frames/neon_%04d.png
X264=(-c:v libx264 -pix_fmt yuv420p -preset slow -movflags +faststart)

# Full quality, 1080×1080
ffmpeg -v error -y -framerate 30 -start_number 1  -i "$F" -frames:v 90  "${X264[@]}" -crf 16 renders/neon-intro.mp4
ffmpeg -v error -y -framerate 30 -start_number 91 -i "$F" -frames:v 120 "${X264[@]}" -crf 16 renders/neon-loop.mp4
# Social square clip: flicker-on, then the loop twice (11 s)
ffmpeg -v error -y -i renders/neon-intro.mp4 -stream_loop 1 -i renders/neon-loop.mp4 \
  -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" -map "[v]" "${X264[@]}" -crf 18 renders/neon-sign-1080.mp4
ffmpeg -v error -y -i renders/frames/neon_0110.png -q:v 3 renders/neon-sign-poster.jpg

# Light copies for the event-video template (shown at 250 px)
mkdir -p ../event-video/public/brand
ffmpeg -v error -y -i renders/neon-intro.mp4 -vf scale=540:540 "${X264[@]}" -crf 22 ../event-video/public/brand/neon-intro.mp4
ffmpeg -v error -y -i renders/neon-loop.mp4  -vf scale=540:540 "${X264[@]}" -crf 22 ../event-video/public/brand/neon-loop.mp4

ls -lh renders/*.mp4 renders/*.jpg ../event-video/public/brand/neon-*.mp4
