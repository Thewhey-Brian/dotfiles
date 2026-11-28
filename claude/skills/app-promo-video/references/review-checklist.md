# Review checklist (stills before renders)

Render 1–3 stills per scene at its cue frames, tile them
(`scripts/contact-sheet.sh`), and look at every tile for:

- [ ] Text overflowing the frame or wrapping into other elements (titles in
      portrait panes especially).
- [ ] Two things sharing a spot: previous word ghosting behind the next, a
      badge on a card, a phone over a tile, outro steps under the logo.
- [ ] Blank or black phone screens (media span ended early / wrong `frames`).
- [ ] A still captured mid-transition (split halves, dark bands).
- [ ] The label that's lit matches what the phone is showing at that moment.
- [ ] Every on-screen claim is in the narration, and every narrated item is on
      screen (`said()` filtering).
- [ ] Before/after boxes show the whole photo (`contain`) and are symmetric
      in count (e.g. 6, not 5).
- [ ] Empty bands in portrait between the words and the phone.
- [ ] Placeholder/other-account content (names, personal notifications) in
      footage.
- [ ] End card: logo, tagline, badge, URL, QR all present and legible.

After the full render:

- [ ] Duration and resolution (`ffprobe`), loudness at target (`ebur128`).
- [ ] A 1–3 fps contact sheet of the whole film for pacing.
- [ ] Short-window loudness around a few voice lines — voice clearly above music.
- [ ] Report: file paths, what changed per request, credits/API spend, anything
      broken in the product you worked around.
