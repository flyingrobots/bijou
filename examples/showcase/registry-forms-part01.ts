import { box } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const FORMS_PART_01: ComponentEntry[] = [
  {
    id: "select",
    name: "select()",
    subtitle: "Single-select menu",
    pkg: "bijou",
    tier: 3,
    description: [
      "# select()",
      "",
      "Interactive single-selection menu with keyboard navigation.",
      "Arrow keys move the cursor, Enter selects.",
      "",
      "**Interactive component** — cannot be embedded in this showcase.",
      "Run standalone to try it:",
      "",
      "```sh",
      "npx tsx examples/select/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Pick a color",
          "",
          "  > Red       (highlighted)",
          "    Blue",
          "    Green",
          "    Yellow",
          "",
          "  (arrow keys navigate, enter selects)",
        ].join("\n"),
        { width: Math.min(40, w), ctx },
      ),
  },
  {
    id: "multiselect",
    name: "multiselect()",
    subtitle: "Checkbox multi-select",
    pkg: "bijou",
    tier: 3,
    description: [
      "# multiselect()",
      "",
      "Interactive multi-selection with checkboxes. Space toggles,",
      "Enter confirms. Supports `maxVisible` scrolling.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/multiselect/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Select toppings",
          "",
          "  [x] Cheese",
          "  [ ] Pepperoni",
          "  [x] Mushrooms",
          "  [ ] Olives",
          "",
          "  (space toggles, enter confirms)",
        ].join("\n"),
        { width: Math.min(40, w), ctx },
      ),
  },
  {
    id: "confirm",
    name: "confirm()",
    subtitle: "Yes/no confirmation",
    pkg: "bijou",
    tier: 3,
    description: [
      "# confirm()",
      "",
      "Simple yes/no confirmation prompt with default value support.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/confirm/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Continue with deployment? (Y/n)",
          "",
          "  (y/n or enter for default)",
        ].join("\n"),
        { width: Math.min(42, w), ctx },
      ),
  },
];
