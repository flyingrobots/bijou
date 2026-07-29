import { progressBar, spinnerFrame } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const DISPLAY_PART_03: ComponentEntry[] = [
  {
    id: "progress-bar",
    name: "progressBar()",
    subtitle: "Static progress indicators",
    pkg: "bijou",
    tier: 1,
    description: [
      "# progressBar()",
      "",
      "Horizontal progress bar at a given percentage.",
      "",
      "**Degradation:** Rich shows colored bar. Pipe shows `[==>  ] 45%`. Accessible shows `Progress: 45%`.",
    ].join("\n"),
    render: (w, ctx) => {
      const barWidth = Math.min(36, w - 2);
      return [
        progressBar(25, { width: barWidth, ctx }),
        progressBar(50, { width: barWidth, ctx }),
        progressBar(75, { width: barWidth, ctx }),
        progressBar(100, { width: barWidth, ctx }),
      ].join("\n");
    },
  },
  {
    id: "spinner",
    name: "spinnerFrame()",
    subtitle: "Animated spinner frames",
    pkg: "bijou",
    tier: 1,
    description: [
      "# spinnerFrame()",
      "",
      "Returns a single frame of a spinner animation. Call with incrementing",
      "frame index from a `tick()` command for animation.",
      "",
      "**Degradation:** Rich shows animated glyph. Pipe/accessible show static text.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        `Frame 0: ${spinnerFrame(0, { ctx })} Loading...`,
        `Frame 1: ${spinnerFrame(1, { ctx })} Loading...`,
        `Frame 2: ${spinnerFrame(2, { ctx })} Loading...`,
        `Frame 3: ${spinnerFrame(3, { ctx })} Loading...`,
      ].join("\n"),
  },
];
