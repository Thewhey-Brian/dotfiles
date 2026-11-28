import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/InstrumentSans";

// The brand. Swap fonts (any @remotion/google-fonts family) and the palette;
// every component reads from here. `C.skyTop/skyBot` paint the backdrop,
// `ink*` the type, `ember` the one warm accent.
export const C = {
  skyTop: "#b6cae3",
  skyBot: "#e4e9f0",
  cloud: "#f7fafd",
  cloudShade: "#d6e0ee",
  glow: "#fdf4e6",
  ember: "#b4682a",
  ink: "#23324a",
  inkMid: "#4c5e79",
  inkSoft: "#7d8da5",
  hair: "rgba(35, 50, 74, 0.16)",
  night: "#0f1623",
};

export const display = loadDisplay("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
loadDisplay("italic", { weights: ["600"], subsets: ["latin"] });
export const body = loadBody("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const W = 1920;
export const H = 1080;
