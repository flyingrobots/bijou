import { markdown } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const DATA_PART_03: ComponentEntry[] = [
  {
    id: "markdown",
    name: "markdown()",
    subtitle: "Terminal markdown renderer",
    pkg: "bijou",
    tier: 1,
    description: [
      "# markdown()",
      "",
      "Renders markdown in the terminal with headings, bold/italic,",
      "code blocks, blockquotes, links, and lists.",
      "",
      "**Degradation:** Rich shows styled markdown. Pipe shows plain text. Accessible shows simplified text.",
    ].join("\n"),
    render: (w, ctx) =>
      markdown(
        [
          "## Hello World",
          "",
          "This is **bold** and *italic* text.",
          "",
          "> A blockquote with wisdom.",
          "",
          "```ts",
          "const x = 42;",
          "```",
          "",
          "- Item one",
          "- Item two",
        ].join("\n"),
        { width: Math.min(50, w), ctx },
      ),
  },
];
