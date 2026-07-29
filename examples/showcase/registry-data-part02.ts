import {
  breadcrumb,
  dag,
  enumeratedList,
  paginator,
  stepper,
} from "@flyingrobots/bijou";
import { SAMPLE_DAG } from "./registry-samples.js";
import type { ComponentEntry } from "./types.js";

export const DATA_PART_02: ComponentEntry[] = [
  {
    id: "breadcrumb",
    name: "breadcrumb()",
    subtitle: "Navigation breadcrumb trails",
    pkg: "bijou",
    tier: 1,
    description: [
      "# breadcrumb()",
      "",
      "Horizontal navigation breadcrumb with separator characters.",
      "",
      "**Degradation:** Rich shows styled path. Pipe/accessible show slash-separated text.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        breadcrumb(["Home", "Projects", "Bijou", "src"], { ctx }),
        breadcrumb(["Settings", "Theme", "Colors"], { ctx }),
      ].join("\n"),
  },
  {
    id: "paginator",
    name: "paginator()",
    subtitle: "Page indicators (dots and text)",
    pkg: "bijou",
    tier: 1,
    description: [
      "# paginator()",
      "",
      "Dot-style or text-style page indicators.",
      "",
      "**Degradation:** Rich shows styled dots. Pipe/accessible show `Page X of Y`.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        paginator({ current: 0, total: 5, ctx }),
        paginator({ current: 2, total: 5, ctx }),
        paginator({ current: 4, total: 5, ctx }),
      ].join("\n"),
  },
  {
    id: "stepper",
    name: "stepper()",
    subtitle: "Step progress indicators",
    pkg: "bijou",
    tier: 1,
    description: [
      "# stepper()",
      "",
      "Multi-step progress indicator showing completed, active, and pending steps.",
      "",
      "**Degradation:** Rich shows styled steps. Pipe/accessible show numbered step list.",
    ].join("\n"),
    render: (_w, ctx) =>
      stepper(
        [
          { label: "Account", status: "complete" },
          { label: "Profile", status: "active" },
          { label: "Review", status: "pending" },
          { label: "Done", status: "pending" },
        ],
        { ctx },
      ),
  },
  {
    id: "dag",
    name: "dag()",
    subtitle: "Directed acyclic graph",
    pkg: "bijou",
    tier: 1,
    description: [
      "# dag()",
      "",
      "ASCII art directed acyclic graph with status badges, edge routing,",
      "node selection, and highlight paths.",
      "",
      "**Degradation:** Rich shows colored graph. Pipe shows plain dependency lines. Accessible shows dependency list.",
    ].join("\n"),
    render: (w, ctx) =>
      dag(SAMPLE_DAG, {
        selectedId: "dev",
        highlightPath: ["plan", "dev", "test", "ship"],
        maxWidth: Math.max(50, w),
        ctx,
      }),
  },
  {
    id: "enumerated-list",
    name: "enumeratedList()",
    subtitle: "Ordered/unordered lists",
    pkg: "bijou",
    tier: 1,
    description: [
      "# enumeratedList()",
      "",
      "Numbered or bulleted lists with 6 bullet styles:",
      "`arabic`, `alpha`, `roman`, `bullet`, `dash`, `none`.",
      "",
      "**Degradation:** All modes render similarly (text-based).",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        enumeratedList(["First item", "Second item", "Third item"], {
          style: "arabic",
          ctx,
        }),
        "",
        enumeratedList(["Alpha one", "Alpha two", "Alpha three"], {
          style: "alpha",
          ctx,
        }),
        "",
        enumeratedList(["Bullet point", "Another point"], {
          style: "bullet",
          ctx,
        }),
      ].join("\n"),
  },
];
