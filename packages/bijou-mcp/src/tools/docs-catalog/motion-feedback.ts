import type { ToolDocsCatalogEntry } from "./types.js";

export const MOTION_FEEDBACK_DOCS: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_spinner",
    family: "spinnerFrame() / createSpinner()",
    category: "Feedback and Status",
    summary:
      "Inline spinner glyphs and live spinner controller for indeterminate work.",
    aliases: ["spinner", "loading spinner", "busy indicator", "working"],
    useWhen: [
      "Work is in flight but there is no honest percentage yet.",
      "You need a compact live-status affordance rather than a large placeholder.",
    ],
    avoidWhen: [
      "Progress is determinate enough for a progress bar or stepper.",
      "The load state wants a full skeleton or empty-state narrative instead.",
    ],
    related: ["progressBar()", "skeleton()", "timer()"],
    exampleArgs: {
      tick: 3,
      label: "Build",
    },
  },
  {
    toolName: "bijou_timer",
    family: "timer() / createTimer() / createStopwatch()",
    category: "Feedback and Status",
    summary:
      "Static and live timer family for countdowns, stopwatches, and elapsed-time readouts.",
    aliases: ["timer", "countdown", "stopwatch", "elapsed time"],
    useWhen: [
      "Time remaining or elapsed time is the core signal.",
      "You need a compact time readout that can degrade across output modes.",
    ],
    avoidWhen: [
      "The user needs task progression rather than wall-clock duration.",
      "A timestamp label is enough and no live timer semantics are needed.",
    ],
    related: [
      "progressBar()",
      "spinnerFrame() / createSpinner()",
      "perfOverlaySurface()",
    ],
    exampleArgs: {
      ms: 150000,
      label: "Deploy",
    },
  },
];
