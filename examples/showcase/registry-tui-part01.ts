import { accordion, box, table } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const TUI_PART_01: ComponentEntry[] = [
  {
    id: "browsable-list",
    name: "browsableList()",
    subtitle: "Keyboard-navigable list",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# browsableList()",
      "",
      "Scrollable, keyboard-navigable list with focus tracking.",
      "State transformers for TEA composition. Vim-style keybindings.",
      "",
      "**Embeddable** — composable in any TEA app via state transformers.",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  > Item one",
          "    Item two",
          "    Item three",
          "    Item four",
          "    Item five",
        ].join("\n"),
        { width: Math.min(36, w), ctx },
      ),
  },
  {
    id: "navigable-table",
    name: "navigableTable()",
    subtitle: "Keyboard-navigable data table",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# navigableTable()",
      "",
      "Data table with row focus, keyboard navigation, page scrolling,",
      "and vim-style keybindings.",
      "",
      "**Embeddable** — composable in any TEA app.",
    ].join("\n"),
    render: (w, ctx) =>
      table({
        columns: [
          { header: "File", width: Math.min(16, Math.floor(w / 3)) },
          { header: "Size", width: 8 },
          { header: "Modified", width: 12 },
        ],
        rows: [
          ["> index.ts", "2.4 KB", "2 hours ago"],
          ["  app.ts", "8.1 KB", "1 day ago"],
          ["  utils.ts", "1.2 KB", "3 days ago"],
        ],
        ctx,
      }),
  },
  {
    id: "pager",
    name: "pager()",
    subtitle: "Scrollable text viewer",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# pager()",
      "",
      "Full-page scrollable text viewer with status line showing position.",
      "Wraps `viewport()` with chrome.",
      "",
      "**Embeddable** — composable in any TEA app.",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  Line 1: Lorem ipsum dolor sit amet",
          "  Line 2: consectetur adipiscing elit",
          "  Line 3: sed do eiusmod tempor",
          "  --------- 3/100 lines ---------",
        ].join("\n"),
        { width: Math.min(44, w), ctx },
      ),
  },
  {
    id: "interactive-accordion",
    name: "interactiveAccordion()",
    subtitle: "Keyboard accordion",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# interactiveAccordion()",
      "",
      "Accordion sections with keyboard focus, expand/collapse, and",
      "expand-all/collapse-all actions.",
      "",
      "**Embeddable** — composable in any TEA app.",
    ].join("\n"),
    render: (_w, ctx) =>
      accordion(
        [
          {
            title: "> Getting Started",
            content: "  Install and configure bijou.",
            expanded: true,
          },
          { title: "  API Reference", content: "", expanded: false },
          { title: "  Examples", content: "", expanded: false },
        ],
        { ctx },
      ),
  },
];
