import type { ToolDocsCatalogEntry } from "./types.js";

export const WORKFLOW_DOCS_CATALOG_PART_01: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_stepper",
    family: "stepper()",
    category: "Feedback and Status",
    summary:
      "Horizontal step-progress indicator with completed and active states.",
    aliases: ["stepper", "steps", "wizard progress", "workflow"],
    useWhen: [
      "The process has named sequential stages.",
      "You want to show both completed and upcoming steps.",
    ],
    avoidWhen: [
      "The flow branches or loops like a graph.",
      "Only a raw percentage matters.",
    ],
    related: ["timeline()", "progressBar()", "tabs()"],
    exampleArgs: {
      steps: [{ label: "Build" }, { label: "Test" }, { label: "Deploy" }],
      current: 1,
    },
  },
  {
    toolName: "bijou_timeline",
    family: "timeline()",
    category: "Feedback and Status",
    summary: "Vertical sequence of timestamp-like events with status markers.",
    aliases: ["timeline", "history", "event stream", "chronology"],
    useWhen: [
      "Order over time is the main story.",
      "Each event needs a short label and optional detail.",
    ],
    avoidWhen: [
      "The relationship is graph-shaped rather than sequential.",
      "You only need the current step, not the event history.",
    ],
    related: ["stepper()", "log()", "dag()"],
    exampleArgs: {
      events: [
        { label: "Build", status: "success" },
        { label: "Deploy", description: "Canary 25%", status: "active" },
      ],
    },
  },
  {
    toolName: "bijou_log",
    family: "log()",
    category: "Feedback and Status",
    summary: "Single structured log line with severity treatment.",
    aliases: ["log", "log line", "event", "status line"],
    useWhen: [
      "You need terse operational events.",
      "Severity should be visible without a full alert box.",
    ],
    avoidWhen: [
      "The message needs explanation, evidence, or grouped detail.",
      "You are rendering a multi-row history rather than one event.",
    ],
    related: ["timeline()", "alert()", "badge()"],
    exampleArgs: {
      level: "info",
      message: "Deployment completed.",
    },
  },
  {
    toolName: "bijou_badge",
    family: "badge()",
    category: "Feedback and Status",
    summary: "Compact inline status pill.",
    aliases: ["badge", "pill", "status chip", "label"],
    useWhen: [
      "A short state label should stay inline with surrounding content.",
      "You need low-chrome categorical emphasis.",
    ],
    avoidWhen: [
      "The message needs body text or explanation.",
      "The state changes over time and deserves a richer progress surface.",
    ],
    related: ["alert()", "log()", "progressBar()"],
    exampleArgs: {
      text: "LIVE",
      variant: "success",
    },
  },
  {
    toolName: "bijou_tabs",
    family: "tabs()",
    category: "Navigation",
    summary: "Horizontal section switcher with one active tab.",
    aliases: ["tabs", "tab bar", "sections", "navigation tabs"],
    useWhen: [
      "People switch between peer views or sections.",
      "One active choice should be visible at a glance.",
    ],
    avoidWhen: [
      "The choices are sequential workflow steps.",
      "The navigation is path-like rather than peer-to-peer.",
    ],
    related: ["breadcrumb()", "paginator()", "stepper()"],
    exampleArgs: {
      items: [{ label: "Overview" }, { label: "Logs" }, { label: "Settings" }],
      active: 1,
    },
  },
  {
    toolName: "bijou_breadcrumb",
    family: "breadcrumb()",
    category: "Navigation",
    summary:
      "Path trail showing where the current surface sits inside a hierarchy.",
    aliases: ["breadcrumb", "path", "location trail"],
    useWhen: [
      "Location context matters more than peer switching.",
      "You need to show depth inside a hierarchy.",
    ],
    avoidWhen: [
      "Users choose between peer views rather than nested locations.",
      "The hierarchy is dense enough to need a tree.",
    ],
    related: ["tabs()", "tree()", "paginator()"],
    exampleArgs: {
      items: ["Home", "Docs", "API"],
    },
  },
];
