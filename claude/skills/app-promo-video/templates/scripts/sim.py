"""Drive an app in the iOS simulator and record clips for a promo video.

    python3 scripts/sim.py <clip> [<clip> ...]

Each clip launches the app in the state it needs (use launch args of a
debug/preview target to open pages directly), records the screen
with `simctl io recordVideo`, and drives it through idb by accessibility
label, so a moved button doesn't silently tap the wrong thing. Raw captures
land in raw/ (not committed); scripts/encode.sh turns them into
public/footage/sim-*.mp4.
"""

import json
import os
import signal
import subprocess
import sys
import time

UDID = os.environ.get("SIM_UDID", "booted")
BUNDLE = os.environ.get("SIM_BUNDLE", "com.example.App")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, "public", "photos")
RAW = os.path.join(ROOT, "raw")
IDB = os.path.expanduser("~/.local/bin/idb")
os.makedirs(RAW, exist_ok=True)


def sh(*args, timeout=60):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def launch(*args, wait=6):
    sh("xcrun", "simctl", "terminate", UDID, BUNDLE)
    time.sleep(0.8)
    sh("xcrun", "simctl", "launch", UDID, BUNDLE, *args)
    time.sleep(wait)


def elements():
    out = sh(IDB, "ui", "describe-all", "--udid", UDID, "--json").stdout
    return json.loads(out or "[]")


def find(label, exact=False):
    for e in elements():
        text = e.get("AXLabel") or ""
        if (text == label) if exact else text.startswith(label):
            f = e["frame"]
            return f["x"] + f["width"] / 2, f["y"] + f["height"] / 2
    raise LookupError(f"no element labelled {label!r}")


def tap(x, y, pause=0.9):
    sh(IDB, "ui", "tap", "--udid", UDID, str(round(x)), str(round(y)))
    time.sleep(pause)


def tapl(label, pause=0.9, exact=False):
    x, y = find(label, exact)
    tap(x, y, pause)


def swipe(x1, y1, x2, y2, duration=0.5, pause=0.8):
    sh(
        IDB,
        "ui",
        "swipe",
        "--udid",
        UDID,
        "--duration",
        str(duration),
        # idb ignores non-integer coordinates without a word.
        str(round(x1)),
        str(round(y1)),
        str(round(x2)),
        str(round(y2)),
    )
    time.sleep(pause)


def type_text(text, pause=0.6):
    sh(IDB, "ui", "text", "--udid", UDID, text)
    time.sleep(pause)


class Record:
    """Records the simulator screen for the duration of a `with` block."""

    def __init__(self, name):
        self.path = os.path.join(RAW, f"{name}.mov")

    def __enter__(self):
        self.proc = subprocess.Popen(
            [
                "xcrun",
                "simctl",
                "io",
                UDID,
                "recordVideo",
                "--codec=h264",
                "--force",
                self.path,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(1.5)
        return self

    def __exit__(self, *exc):
        # recordVideo drops the last second or two; give it a tail.
        time.sleep(2.5)
        self.proc.send_signal(signal.SIGINT)
        self.proc.wait(timeout=30)
        print(f"recorded {self.path}")


def drag_slider(dx, pause=1.0):
    # The active slider's track runs 12..428 at y≈776; its thumb rests at centre.
    swipe(220, 776, 220 + dx, 776, duration=0.9, pause=pause)


def frame_of(label):
    for e in elements():
        if (e.get("AXLabel") or "") == label:
            return e["frame"]
    return None


def frame_of_prefix(prefix):
    for e in elements():
        if (e.get("AXLabel") or "").startswith(prefix):
            return e["frame"]
    raise LookupError(prefix)


def bring_into_view(label, y, lo=90, hi=350):
    """Scrolls a horizontal rail in measured steps until `label` is on screen."""
    for _ in range(24):
        f = frame_of(label)
        if f is None:
            raise LookupError(label)
        x = f["x"] + f["width"] / 2
        if lo < x < hi:
            return x
        # A slow drag here is a long press (the rail reorders by drag), and
        # a quick flick carries on for about four times its length: flick a
        # quarter of the gap, from rest.
        step = max(-100, min(100, (x - 220) / 4))
        swipe(220 + step / 2, y, 220 - step / 2, y, duration=0.15, pause=1.4)
    raise LookupError(f"{label} never came into view")


def versions():
    """The version strip's entries: 'Original, 1:27 AM', 'Field Notes, …'."""
    return [e for e in elements() if "\u202f" in (e.get("AXLabel") or "")]


def wait_for_new_version(before, limit=240):
    t0 = time.time()
    while time.time() - t0 < limit:
        time.sleep(4)
        if len(versions()) > before:
            time.sleep(5)
            return round(time.time() - t0)
    return None


def snap_photo(out_path):
    """Crops the photo off the screen: the largest unlabeled element on it."""
    big = [e for e in elements() if not (e.get("AXLabel") or "").strip() or
           (e.get("AXLabel") or "").startswith("Animated original")]
    big = [e for e in big if e["frame"]["width"] > 300 and e["frame"]["height"] > 200
           and e["frame"]["height"] < 900]
    f = max(big, key=lambda e: e["frame"]["width"] * e["frame"]["height"])["frame"]
    shot = os.path.join(RAW, "_screen.png")
    sh("xcrun", "simctl", "io", UDID, "screenshot", shot)
    from PIL import Image
    im = Image.open(shot)
    k = im.size[0] / 440
    inset = 6  # clear the rounded corners
    box = tuple(round(v * k) for v in (f["x"] + inset, f["y"] + inset,
                                       f["x"] + f["width"] - inset, f["y"] + f["height"] - inset))
    im.crop(box).convert("RGB").save(out_path, quality=92)
    print("saved", out_path, box)


def scroll_to(label, target_y=150, exact=True):
    """Drags the page slowly (no fling) until `label` sits near target_y."""
    for _ in range(8):
        f = frame_of(label) if exact else next(
            (e["frame"] for e in elements() if (e.get("AXLabel") or "").startswith(label)), None)
        if f is None:
            swipe(220, 760, 220, 460, duration=1.2, pause=0.6)
            continue
        dy = f["y"] - target_y
        if abs(dy) < 30:
            return
        dy = max(-420, min(420, dy))
        swipe(220, 600 + dy / 2, 220, 600 - dy / 2, duration=1.4, pause=0.8)


def probe(label_filter=""):
    for e in elements():
        text = e.get("AXLabel") or ""
        if label_filter.lower() in text.lower():
            f = e["frame"]
            print(
                repr(text[:60]),
                int(f["x"]),
                int(f["y"]),
                int(f["width"]),
                int(f["height"]),
            )


# ------------------------------------------------------------------ clips --
# One function per clip. Pattern: launch in the right state, get to the start
# point *before* recording, then record only the flow. Log marks when a flow
# has distinct steps, so footage spans can be cut precisely.


def example():
    launch(wait=6)  # add "-some-launch-arg", "value" to open a page directly
    marks = {}
    with Record("example"):
        t0 = time.time()
        mark = lambda k: marks.__setitem__(k, round(time.time() - t0 + 1.5, 2))
        time.sleep(1.5)
        mark("start")
        # tapl("Some button")                 # by accessibility label
        # x = bring_into_view("Item", y=690)  # horizontal rail
        # tap(x, 690)
        # swipe(220, 700, 220, 400, duration=0.9, pause=2)  # vertical page
    print(json.dumps(marks))


CLIPS = {"example": example}

if __name__ == "__main__":
    if sys.argv[1] == "probe":
        probe(sys.argv[2] if len(sys.argv) > 2 else "")
    else:
        for name in sys.argv[1:]:
            CLIPS[name]()
