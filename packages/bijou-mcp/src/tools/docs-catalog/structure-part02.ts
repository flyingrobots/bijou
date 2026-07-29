import type { ToolDocsCatalogEntry } from "./types.js";

export const STRUCTURE_DOCS_CATALOG_PART_02: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_separator",
    family: "separator()",
    category: "Containers and Layout",
    summary: "Horizontal rule with optional centered label.",
    aliases: ["separator", "divider", "rule"],
    useWhen: [
      "You need a clear break between sections.",
      "A short label should orient the next block of content.",
    ],
    avoidWhen: [
      "You need an actual container rather than a visual divider.",
      "The surrounding layout already makes section boundaries obvious.",
    ],
    related: ["box()", "headerBox()", "tabs()"],
    exampleArgs: {
      label: "release queue",
      width: 32,
    },
  },
  {
    toolName: "bijou_constrain",
    family: "constrain()",
    category: "Containers and Layout",
    summary: "Text truncation helper for bounded width and height.",
    aliases: ["constrain", "truncate", "clamp", "ellipsis"],
    useWhen: [
      "Free-form text must fit a strict width or height.",
      "A preview should stay honest without rewriting the source text.",
    ],
    avoidWhen: [
      "You actually need wrapping instead of truncation.",
      "The source content is important enough to merit a scrollable container.",
    ],
    related: ["box()", "markdown()", "table()"],
    exampleArgs: {
      content:
        "This is a long release note preview that should be clipped before it overruns the surrounding layout.",
      maxWidth: 26,
    },
  },
  {
    toolName: "bijou_alert",
    family: "alert()",
    category: "Feedback and Status",
    summary: "Severity callout with icon and bordered container.",
    aliases: ["alert", "warning", "error", "success", "info"],
    useWhen: [
      "A message needs strong severity signaling.",
      "The reader should treat the content as a callout rather than ambient copy.",
    ],
    avoidWhen: [
      "You need transient notification behavior rather than a static panel.",
      "The state is low-stakes enough for a badge or note.",
    ],
    related: ["badge()", "log()", "explainability()"],
    exampleArgs: {
      message: "Canary error budget is almost exhausted.",
      variant: "warning",
    },
  },
  {
    toolName: "bijou_note",
    family: "note()",
    category: "Feedback and Status",
    summary:
      "Calm explanatory note for form flows and inline guidance without alert-level urgency.",
    aliases: ["note", "helper text", "supporting note", "inline guidance"],
    useWhen: [
      "You need supportive explanatory text that should not compete with primary status messaging.",
      "A form, guided flow, or inspector needs clarifying context without turning into an alert.",
    ],
    avoidWhen: [
      "The message carries urgency, severity, or a required next action.",
      "The content is long-form prose that should live in markdown() or guidedFlow().",
    ],
    related: ["alert()", "markdown()", "group() / wizard()"],
    exampleArgs: {
      title: "Deploy window",
      message: "Rotate credentials after the canary completes.",
    },
  },
  {
    toolName: "bijou_progress_bar",
    family: "progressBar()",
    category: "Feedback and Status",
    summary: "Static completion bar with optional percent label.",
    aliases: ["progress", "progress bar", "percent", "completion"],
    useWhen: [
      "A single bounded percentage is the important state.",
      "You need a compact progress signal inside another surface.",
    ],
    avoidWhen: [
      "The workflow has named steps rather than a pure percent.",
      "The state is indeterminate and should be shown as loading instead.",
    ],
    related: ["stepper()", "timeline()", "skeleton()"],
    exampleArgs: {
      percent: 72,
      width: 20,
    },
  },
];
