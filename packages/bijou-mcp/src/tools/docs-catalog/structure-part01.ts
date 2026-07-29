import type { ToolDocsCatalogEntry } from "./types.js";

export const STRUCTURE_DOCS_CATALOG_PART_01: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_table",
    family: "table()",
    category: "Data and Structure",
    summary: "Rectangular data grid with headers and box-drawing borders.",
    aliases: ["table", "grid", "rows", "columns"],
    useWhen: [
      "Your data is naturally row-and-column shaped.",
      "People need to compare values across consistent fields.",
    ],
    avoidWhen: [
      "The structure is hierarchical rather than tabular.",
      "You need narrative prose more than aligned comparison.",
    ],
    related: ["dag()", "tree()", "enumeratedList()"],
    exampleArgs: {
      columns: [{ header: "Service" }, { header: "Status" }],
      rows: [
        ["api", "healthy"],
        ["worker", "healthy"],
      ],
      width: 40,
    },
  },
  {
    toolName: "bijou_tree",
    family: "tree()",
    category: "Data and Structure",
    summary: "Nested hierarchy with Unicode connectors.",
    aliases: ["tree", "hierarchy", "outline", "nested"],
    useWhen: [
      "The data has parent-child nesting.",
      "Expansion order matters more than cross-node comparison.",
    ],
    avoidWhen: [
      "You need many-to-many relationships or cross-links.",
      "The data is better scanned as rows and columns.",
    ],
    related: ["dag()", "enumeratedList()", "table()"],
    exampleArgs: {
      nodes: [
        {
          label: "docs",
          children: [{ label: "design-system" }, { label: "release" }],
        },
      ],
    },
  },
  {
    toolName: "bijou_dag",
    family: "dag()",
    category: "Data and Structure",
    summary: "Directed graph with boxed nodes and routed edges.",
    aliases: ["dag", "graph", "dependency graph", "flow graph"],
    useWhen: [
      "Relationships are graph-shaped rather than purely hierarchical.",
      "You need to show dependencies, branches, or converging flows.",
    ],
    avoidWhen: [
      "A linear timeline or step list would explain the flow more clearly.",
      "The structure is simple enough for a tree or breadcrumb.",
    ],
    related: ["tree()", "timeline()", "table()"],
    exampleArgs: {
      nodes: [
        { id: "build", label: "Build", edges: ["test"] },
        { id: "test", label: "Test", edges: ["deploy"] },
        { id: "deploy", label: "Deploy" },
      ],
      maxWidth: 60,
    },
  },
  {
    toolName: "bijou_enumerated_list",
    family: "enumeratedList()",
    category: "Data and Structure",
    summary:
      "List renderer for bullets, ordered steps, letters, or roman numerals.",
    aliases: ["enumerated list", "list", "bullet list", "ordered list"],
    useWhen: [
      "You need a lightweight ordered or unordered list.",
      "Sequence matters but rich container chrome would be overkill.",
    ],
    avoidWhen: [
      "Items need per-row metadata or aligned fields.",
      "The structure is better represented as tabs, steps, or a tree.",
    ],
    related: ["stepper()", "timeline()", "table()"],
    exampleArgs: {
      items: ["Build", "Test", "Deploy"],
      style: "arabic",
    },
  },
  {
    toolName: "bijou_box",
    family: "box()",
    category: "Containers and Layout",
    summary:
      "Generic bordered container for prose, status, or grouped content.",
    aliases: ["box", "panel", "container"],
    useWhen: [
      "Content needs a visible boundary or title.",
      "You want a neutral container that does not imply workflow state.",
    ],
    avoidWhen: [
      "The content wants a more opinionated component such as alert or inspector.",
      "The output is simple enough to stay as plain text.",
    ],
    related: ["headerBox()", "alert()", "inspector()"],
    exampleArgs: {
      content: "Release ready for canary.",
      title: "status",
    },
  },
  {
    toolName: "bijou_header_box",
    family: "headerBox()",
    category: "Containers and Layout",
    summary:
      "Compact labeled container with a heading and optional detail line.",
    aliases: ["header box", "summary panel", "heading panel"],
    useWhen: [
      "A compact callout needs a strong label up front.",
      "You want a container with more voice than a generic box.",
    ],
    avoidWhen: [
      "You need multi-section detail instead of a headline summary.",
      "The content is only one line and does not need chrome.",
    ],
    related: ["box()", "inspector()", "alert()"],
    exampleArgs: {
      label: "Release",
      detail: "stable",
    },
  },
];
