# Capturing an iOS app from the simulator

Tools: `xcrun simctl` (boot, launch, addmedia, recordVideo, screenshot) and
Meta's idb for input and the accessibility tree.

```sh
brew tap facebook/fb && brew install facebook/fb/idb-companion
python3 -m pip install --user fb-idb        # CLI at ~/.local/bin/idb
idb connect <UDID>
idb ui describe-all --udid <UDID> --json    # every element: AXLabel + frame (points)
```

`templates/scripts/sim.py` wraps this: `launch()`, `elements()`, `find()`,
`tapl(label)`, `swipe()`, `type_text()`, `bring_into_view()` for horizontal
rails, `versions()/wait_for_new_version()`, `snap_photo()`, and a `Record`
context manager. Add one function per clip to `CLIPS`.

## Rules

- **Drive by accessibility label**, not coordinates, whenever the element is
  in-process. Out-of-process UI (the system photo picker) has no tree — tap its
  grid by position and note the order (newest first).
- **Sign-in is the user's job.** Launch the real app and ask them to log in
  (never type credentials). A preview/debug harness target that can open
  specific pages with launch args (`-preview-page store`) saves hours.
- Use the device the store screenshots use (iPhone Pro Max: 1320×2868 px,
  440×956 pt). Coordinates are in points.

## Traps (each cost real time)

- **idb silently ignores non-integer coordinates** — `round()` every swipe/tap.
- **Slow drags on reorderable rails are long-presses.** Scroll horizontal rails
  with short fast flicks (0.15 s) of ~¼ the remaining distance; a flick carries
  ~4× its length. Vertical pages: 0.9 s drags of ~300 pt.
- **Debug harnesses often default to a mock/test mode** for paid actions — pass
  the flag that turns it off (e.g. `-testMode NO`) or you'll record fake results.
- **First real async action may trigger a permission prompt** (notifications)
  that blocks the flow — dismiss it (the privacy-preserving choice) and re-take.
- **Busy detection by label text is fragile.** Detect completion by a durable
  signal (a new item in a version strip, a "Done"/"Save" button appearing).
- **`recordVideo` drops the last ~2 s** — sleep 2.5 s before SIGINT.
- **`simctl addmedia` can hang on a fresh device** — boot, open Photos once, add
  one file with a timeout, then the rest; restart the simulator if wedged.
- **Crop the status bar** from every clip (time, recording dot, and any
  notification banner with personal names).
- **Recording in the user's account leaves artifacts** (creations, library
  items). Tell them; don't delete without asking.
- **Features can be flaky on the day** (a store section not loading). Check
  the screen before recording; work around in the edit, and report it.
- Stills of results: wait ≥5 s after a transition, then crop the screenshot
  to the image element's frame (inset a few px to lose rounded corners).
