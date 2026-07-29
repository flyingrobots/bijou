import { box } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const FORMS_PART_02: ComponentEntry[] = [
  {
    id: "input",
    name: "input()",
    subtitle: "Text input with validation",
    pkg: "bijou",
    tier: 3,
    description: [
      "# input()",
      "",
      "Single-line text input with placeholder, validation, and required mode.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/input/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Enter your name",
          "",
          "  > Alice_",
          "",
          "  (type and press enter)",
        ].join("\n"),
        { width: Math.min(40, w), ctx },
      ),
  },
  {
    id: "filter",
    name: "filter()",
    subtitle: "Fuzzy-filter select",
    pkg: "bijou",
    tier: 3,
    description: [
      "# filter()",
      "",
      "Type-to-filter selection with fuzzy keyword matching.",
      "Supports vim-style normal/insert mode switching.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/filter/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Search files",
          "  > src/comp_",
          "",
          "  > src/components/box.ts",
          "    src/components/badge.ts",
          "    src/components/alert.ts",
          "",
          "  3 matches",
        ].join("\n"),
        { width: Math.min(42, w), ctx },
      ),
  },
  {
    id: "textarea",
    name: "textarea()",
    subtitle: "Multi-line text input",
    pkg: "bijou",
    tier: 3,
    description: [
      "# textarea()",
      "",
      "Multi-line text editor with cursor navigation, line numbers,",
      "and maxLength enforcement.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/textarea/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  ? Describe the issue",
          "",
          "  1 | The build fails when",
          "  2 | running on Node 22_",
          "  3 |",
          "",
          "  (ctrl+d to submit)",
        ].join("\n"),
        { width: Math.min(42, w), ctx },
      ),
  },
];
