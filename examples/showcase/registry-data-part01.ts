import { accordion, table, tabs, timeline, tree } from "@flyingrobots/bijou";
import { SAMPLE_TIMELINE, SAMPLE_TREE } from "./registry-samples.js";
import type { ComponentEntry } from "./types.js";

export const DATA_PART_01: ComponentEntry[] = [
  {
    id: "table",
    name: "table()",
    subtitle: "Data tables with columns",
    pkg: "bijou",
    tier: 1,
    description: [
      "# table()",
      "",
      "Tabular data display with typed columns, alignment, and width constraints.",
      "",
      "**Degradation:** Rich shows bordered table. Pipe shows TSV. Accessible shows row-label format.",
    ].join("\n"),
    render: (w, ctx) =>
      table({
        columns: [
          { header: "Name", width: Math.min(14, Math.floor(w / 4)) },
          { header: "Role", width: Math.min(12, Math.floor(w / 4)) },
          { header: "Status", width: Math.min(10, Math.floor(w / 4)) },
        ],
        rows: [
          ["Alice", "Engineer", "active"],
          ["Bob", "Designer", "away"],
          ["Carol", "PM", "offline"],
        ],
        ctx,
      }),
  },
  {
    id: "tree",
    name: "tree()",
    subtitle: "Hierarchical tree views",
    pkg: "bijou",
    tier: 1,
    description: [
      "# tree()",
      "",
      "Indented tree display with unicode branch characters.",
      "",
      "**Degradation:** Rich shows styled tree lines. Pipe shows ASCII tree. Accessible shows indented list.",
    ].join("\n"),
    render: (_w, ctx) => tree(SAMPLE_TREE, { ctx }),
  },
  {
    id: "accordion",
    name: "accordion()",
    subtitle: "Expandable content sections",
    pkg: "bijou",
    tier: 1,
    description: [
      "# accordion()",
      "",
      "Static expandable/collapsible content sections. For interactive accordion,",
      "see `interactiveAccordion()` in bijou-tui.",
      "",
      "**Degradation:** Rich shows styled headers. Pipe/accessible show text sections.",
    ].join("\n"),
    render: (_w, ctx) =>
      accordion(
        [
          {
            title: "Getting Started",
            content: "Install with npm install @flyingrobots/bijou",
            expanded: true,
          },
          {
            title: "Configuration",
            content: "Set BIJOU_THEME env var to choose a preset.",
            expanded: false,
          },
          {
            title: "Advanced",
            content: "Use createBijou() for custom port wiring.",
            expanded: false,
          },
        ],
        { ctx },
      ),
  },
  {
    id: "timeline",
    name: "timeline()",
    subtitle: "Event timelines with status",
    pkg: "bijou",
    tier: 1,
    description: [
      "# timeline()",
      "",
      "Vertical timeline with status-colored markers.",
      "Statuses: `success`, `active`, `warning`, `muted`.",
      "",
      "**Degradation:** Rich shows colored dots + lines. Pipe shows `[STATUS] label`. Accessible same as pipe.",
    ].join("\n"),
    render: (_w, ctx) => timeline(SAMPLE_TIMELINE, { ctx }),
  },
  {
    id: "tabs",
    name: "tabs()",
    subtitle: "Tab bar navigation",
    pkg: "bijou",
    tier: 1,
    description: [
      "# tabs()",
      "",
      "Static tab bar with active tab highlighting and optional badge counts.",
      "",
      "**Degradation:** Rich shows styled tabs. Pipe shows `[active] inactive`. Accessible shows labeled list.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        tabs(
          [
            { label: "Overview", active: true },
            { label: "Files", badge: "12" },
            { label: "Settings" },
          ],
          { ctx },
        ),
        "",
        tabs(
          [
            { label: "Home" },
            { label: "Dashboard", active: true, badge: "3" },
            { label: "Logs" },
          ],
          { ctx },
        ),
      ].join("\n"),
  },
];
