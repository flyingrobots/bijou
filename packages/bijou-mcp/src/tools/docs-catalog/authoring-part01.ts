import type { ToolDocsCatalogEntry } from "./types.js";

export const AUTHORING_DOCS_CATALOG_PART_01: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_hyperlink",
    family: "hyperlink()",
    category: "Utility",
    summary: "Terminal hyperlink with explicit plain-text fallback behavior.",
    aliases: ["hyperlink", "link", "url", "osc 8"],
    useWhen: [
      "The destination matters and should stay explicit.",
      "A plain-text fallback still needs to make sense when OSC 8 is unavailable.",
    ],
    avoidWhen: [
      "You are just styling text without a destination.",
      "The raw URL alone is clearer than link text.",
    ],
    related: ["kbd()", "markdown()", "box()"],
    exampleArgs: {
      text: "Bijou docs",
      url: "https://github.com/flyingrobots/bijou",
    },
  },
  {
    toolName: "bijou_skeleton",
    family: "skeleton()",
    category: "Utility",
    summary: "Placeholder loading surface for still-unavailable content.",
    aliases: ["skeleton", "placeholder", "loading", "shimmer"],
    useWhen: [
      "Content is loading and the future shape matters.",
      "You need a compact visual placeholder rather than a spinner alone.",
    ],
    avoidWhen: [
      "The state is determinate enough for a progress bar or stepper.",
      "The load is instantaneous and placeholder chrome adds noise.",
    ],
    related: ["progressBar()", "badge()", "alert()"],
    exampleArgs: {
      width: 24,
      lines: 2,
    },
  },
  {
    toolName: "bijou_markdown",
    family: "markdown()",
    category: "Narrative and Content",
    summary:
      "Mode-aware terminal markdown renderer for headings, lists, code blocks, links, and quotes.",
    aliases: ["markdown", "md", "rich text", "docs prose"],
    useWhen: [
      "Source text already exists as markdown and should stay authored that way.",
      "You need headings, lists, quotes, and inline emphasis without rebuilding the prose by hand.",
    ],
    avoidWhen: [
      "The content is structured data that should be table-, tree-, or graph-shaped.",
      "You need one focused callout rather than a narrative document block.",
    ],
    related: ["hyperlink()", "box()", "guidedFlow()"],
    exampleArgs: {
      source: "# Release\n\n- Build\n- Test\n- Deploy",
      width: 32,
    },
  },
  {
    toolName: "bijou_guided_flow",
    family: "guidedFlow()",
    category: "Narrative and Content",
    summary:
      "Structured explainability block for posture, steps, sections, and next action.",
    aliases: ["guided flow", "runbook", "operator guide", "playbook"],
    useWhen: [
      "Readers need a guided operational story instead of an undifferentiated text dump.",
      "You want summary, steps, supporting sections, and a next action inside one coherent block.",
    ],
    avoidWhen: [
      "A lightweight list, table, or alert would explain the state more directly.",
      "The content is free-form markdown rather than a guided operational flow.",
    ],
    related: ["explainability()", "markdown()", "stepper()"],
    exampleArgs: {
      title: "Release canary",
      label: "Flow",
      summary: "Roll canaries to 25% before global promote.",
      steps: [
        { title: "Build", status: "complete" },
        {
          title: "Canary",
          status: "current",
          detail: "Watch error budget for 15 minutes.",
        },
        { title: "Promote", status: "pending" },
      ],
      nextAction: "Hold at 25% until latency stays green.",
      width: 48,
    },
  },
  {
    toolName: "bijou_preference_list",
    family: "preferenceListSurface()",
    category: "Forms and Settings",
    summary:
      "Structured settings list with toggles, actions, descriptions, and selected-row state.",
    aliases: [
      "preference list",
      "settings list",
      "preferences",
      "settings panel",
    ],
    useWhen: [
      "Settings need sectioned rows, values, and secondary descriptions.",
      "A shell or page needs a settings surface rather than an ad hoc list of toggles.",
    ],
    avoidWhen: [
      "You only need one or two status pills or buttons.",
      "The content is narrative guidance rather than configurable rows.",
    ],
    related: ["tabs()", "box()", "guidedFlow()"],
    exampleArgs: {
      sections: [
        {
          id: "shell",
          title: "Shell",
          rows: [
            {
              id: "theme",
              label: "Theme",
              valueLabel: "Verdant Plum",
              kind: "choice",
            },
            {
              id: "perf",
              label: "Perf HUD",
              checked: true,
              kind: "toggle",
              description: "Show development perf overlay.",
            },
          ],
        },
      ],
      width: 42,
      selectedRowId: "perf",
    },
  },
];
