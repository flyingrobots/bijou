import type { ToolDocsCatalogEntry } from "./types.js";

export const WORKFLOW_DOCS_CATALOG_PART_02: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_paginator",
    family: "paginator()",
    category: "Navigation",
    summary: "Compact indicator for current page or viewport position.",
    aliases: ["paginator", "pagination", "page indicator", "page dots"],
    useWhen: [
      "The user needs lightweight position awareness across pages.",
      "Full tabs or breadcrumbs would be too heavy for the surface.",
    ],
    avoidWhen: [
      "Page labels matter more than page count.",
      "The navigation is hierarchical rather than sequential.",
    ],
    related: ["tabs()", "breadcrumb()", "stepper()"],
    exampleArgs: {
      current: 2,
      total: 5,
      style: "dots",
    },
  },
  {
    toolName: "bijou_explainability",
    family: "explainability()",
    category: "Rich Panels",
    summary:
      "Decision card with rationale, evidence, confidence, and next action.",
    aliases: ["explainability", "explanation", "decision card", "ai rationale"],
    useWhen: [
      "A recommendation or decision needs supporting evidence.",
      "You want the reader to audit reasoning, not just accept output.",
    ],
    avoidWhen: [
      "The content is simple status or prose without structured rationale.",
      "A generic box or inspector already carries enough context.",
    ],
    related: ["inspector()", "alert()", "note()"],
    exampleArgs: {
      title: "Choose table()",
      label: "Recommendation",
      rationale:
        "The data is rectangular and the reader needs aligned field comparison.",
      evidence: [
        { label: "Shape", value: "rows × columns" },
        { label: "Need", value: "compare values side by side" },
      ],
      confidence: "high",
    },
  },
  {
    toolName: "bijou_inspector",
    family: "inspector()",
    category: "Rich Panels",
    summary:
      "Detail panel with a primary value and structured supporting sections.",
    aliases: ["inspector", "detail panel", "detail view", "property panel"],
    useWhen: [
      "A single object or resource needs focused inspection.",
      "You need a primary value plus labeled supporting sections.",
    ],
    avoidWhen: [
      "The content is really an alert or recommendation.",
      "A flat table or list is enough.",
    ],
    related: ["explainability()", "box()", "headerBox()"],
    exampleArgs: {
      title: "Service",
      currentValue: "healthy",
      currentValueLabel: "Status",
      supportingText: "us-west-2",
      supportingTextLabel: "Region",
      sections: [{ title: "Deploy", content: "Canary complete." }],
    },
  },
  {
    toolName: "bijou_accordion",
    family: "accordion()",
    category: "Rich Panels",
    summary: "Collapsible sections for progressive disclosure.",
    aliases: ["accordion", "collapsible", "disclosure", "expand/collapse"],
    useWhen: [
      "Not every section should be open at once.",
      "The reader benefits from progressive disclosure.",
    ],
    avoidWhen: [
      "Everything should remain visible together for comparison.",
      "The user is switching peer views rather than expanding sections.",
    ],
    related: ["tabs()", "inspector()", "box()"],
    exampleArgs: {
      sections: [
        { title: "Deploy", content: "Roll canaries to 25%.", expanded: true },
        { title: "Rollback", content: "Restore the previous stable build." },
      ],
    },
  },
  {
    toolName: "bijou_kbd",
    family: "kbd()",
    category: "Utility",
    summary: "Keyboard keycap renderer for inline shortcut hints.",
    aliases: ["kbd", "keycap", "shortcut key", "keyboard hint"],
    useWhen: [
      "You need to show a shortcut inline.",
      "The key label should read like UI chrome rather than plain prose.",
    ],
    avoidWhen: [
      "The shortcut is incidental and plain text is enough.",
      "You need a full help table rather than one key hint.",
    ],
    related: ["hyperlink()", "badge()", "tabs()"],
    exampleArgs: {
      key: "Ctrl+P",
    },
  },
];
