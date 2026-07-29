import type { ToolDocsCatalogEntry } from "./types.js";

export const AUTHORING_DOCS_CATALOG_PART_02: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_text_entry",
    family: "input() / textarea()",
    category: "Forms and Settings",
    summary:
      "Short-form and multiline text-entry prompts for collecting authored input rather than choosing from a fixed set.",
    aliases: [
      "text entry",
      "input",
      "textarea",
      "text field",
      "free-form text",
    ],
    useWhen: [
      "The user needs to enter original text rather than choose a predefined value.",
      "The difference between short-form and multiline entry matters to the task.",
    ],
    avoidWhen: [
      "The result is really a choice from a stable option set.",
      "A static content block or note would be more honest than an editable prompt.",
    ],
    related: ["select() / filter()", "group() / wizard()", "note()"],
    exampleArgs: {
      inputTitle: "Cluster name",
      inputDefault: "prod-us-west-2",
      textareaTitle: "Rollback notes",
      textareaValue: "Drain traffic\nPromote stable build",
    },
  },
  {
    toolName: "bijou_single_choice",
    family: "select() / filter()",
    category: "Forms and Settings",
    summary:
      "Single-choice prompt family for visible-list selection and searchable narrowing.",
    aliases: ["single choice", "select", "filter", "dropdown", "combo box"],
    useWhen: [
      "The user is choosing one durable value from a known option set.",
      "Search/narrowing helps, but the end result is still one selected value.",
    ],
    avoidWhen: [
      "The user is building a set rather than making one choice.",
      "The interaction is command dispatch rather than stored selection state.",
    ],
    related: ["multiselect()", "input() / textarea()", "group() / wizard()"],
    exampleArgs: {
      title: "Release channel",
      options: ["stable", "canary", "nightly"],
      selected: "canary",
    },
  },
  {
    toolName: "bijou_multiple_choice",
    family: "multiselect()",
    category: "Forms and Settings",
    summary: "Checkbox-style set builder for choosing several durable values.",
    aliases: ["multiple choice", "multiselect", "checkboxes", "set selection"],
    useWhen: [
      "The user is building a set of selected values.",
      "The options read like members of one coherent collection.",
    ],
    avoidWhen: [
      "Only one choice is valid.",
      "The rows are commands or actions instead of lasting state.",
    ],
    related: ["select() / filter()", "confirm()", "group() / wizard()"],
    exampleArgs: {
      title: "Deploy targets",
      options: ["api", "web", "worker"],
      selected: ["web", "worker"],
    },
  },
  {
    toolName: "bijou_binary_decision",
    family: "confirm()",
    category: "Forms and Settings",
    summary:
      "Explicit yes-or-no confirmation prompt for genuinely binary decisions.",
    aliases: ["binary decision", "confirm", "yes no", "confirmation"],
    useWhen: [
      "The choice is honestly binary and the consequence of yes versus no matters.",
      "A simple confirmation is clearer than a larger staged form.",
    ],
    avoidWhen: [
      "The user really has multiple options or tradeoffs to compare.",
      "The prompt needs rich evidence or explanation instead of a binary gate.",
    ],
    related: ["alert()", "multiselect()", "group() / wizard()"],
    exampleArgs: {
      title: "Continue deployment",
      defaultValue: true,
      answer: "y",
    },
  },
  {
    toolName: "bijou_multi_field_forms",
    family: "group() / wizard()",
    category: "Forms and Settings",
    summary:
      "Grouped and staged form orchestration for related inputs, progress, and branching flow.",
    aliases: [
      "group",
      "wizard",
      "multi-step form",
      "staged form",
      "grouped form",
    ],
    useWhen: [
      "Several related inputs belong together under one goal or workflow.",
      "Progress, grouping, or branching matters more than one isolated prompt.",
    ],
    avoidWhen: [
      "The task only needs one simple field.",
      "The fields are unrelated and should not be bundled into one flow.",
    ],
    related: [
      "input() / textarea()",
      "select() / filter()",
      "confirm()",
      "stepper()",
    ],
    exampleArgs: {
      stepLabel: "Step 2 of 3",
      stepTitle: "Approval",
      fields: [
        "Cluster name? [prod-us-west-2]",
        "Release channel?",
        "1. stable",
        "2. canary",
        "3. nightly",
        "> 2",
        "Continue deployment? [Y/n]",
        "> y",
      ],
    },
  },
];
