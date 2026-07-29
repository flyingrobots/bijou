import {
  skeleton,
  kbd,
  hyperlink,
  log,
  gradientText,
} from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const DISPLAY_PART_02: ComponentEntry[] = [
  {
    id: "skeleton",
    name: "skeleton()",
    subtitle: "Loading placeholders",
    pkg: "bijou",
    tier: 1,
    description: [
      "# skeleton()",
      "",
      "Animated shimmer-style loading placeholders for content that has not loaded yet.",
      "",
      "**Degradation:** Rich shows shaded blocks. Pipe/accessible show placeholder dashes.",
    ].join("\n"),
    render: (w, ctx) =>
      [
        skeleton({ width: Math.min(30, w), height: 1, ctx }),
        skeleton({ width: Math.min(20, w), height: 1, ctx }),
        skeleton({ width: Math.min(25, w), height: 1, ctx }),
        "",
        skeleton({ width: Math.min(40, w), height: 3, ctx }),
      ].join("\n"),
  },
  {
    id: "kbd",
    name: "kbd()",
    subtitle: "Keyboard shortcut display",
    pkg: "bijou",
    tier: 1,
    description: [
      "# kbd()",
      "",
      "Rendered keyboard shortcut badges, styled like physical key caps.",
      "",
      "**Degradation:** Rich shows styled key. Pipe/accessible show `[key]` brackets.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        `${kbd("Ctrl", { ctx })}+${kbd("C", { ctx })} to quit`,
        `${kbd("Tab", { ctx })} to switch focus`,
        `${kbd("?", { ctx })} for help`,
        `${kbd("Esc", { ctx })} to cancel`,
      ].join("\n"),
  },
  {
    id: "hyperlink",
    name: "hyperlink()",
    subtitle: "Clickable terminal links (OSC 8)",
    pkg: "bijou",
    tier: 1,
    description: [
      "# hyperlink()",
      "",
      "Clickable OSC 8 terminal hyperlinks. Falls back to `text (url)` in terminals",
      "that do not support the protocol.",
      "",
      "**Degradation:** Rich shows clickable link. Pipe/accessible show `text (url)`.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        hyperlink("Bijou on GitHub", "https://github.com/flyingrobots/bijou", {
          ctx,
        }),
        hyperlink("Documentation", "https://bijou.dev/docs", { ctx }),
      ].join("\n"),
  },
  {
    id: "log",
    name: "log()",
    subtitle: "Leveled styled output",
    pkg: "bijou",
    tier: 1,
    description: [
      "# log()",
      "",
      "Leveled log output with status-colored prefixes.",
      "Levels: `debug`, `info`, `warn`, `error`, `fatal`.",
      "",
      "**Degradation:** Rich shows colored prefix. Pipe shows `[LEVEL]` prefix. Accessible same as pipe.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        log("debug", "Connecting to database...", { ctx }),
        log("info", "Server started on port 3000", { ctx }),
        log("warn", "Deprecated API used in /v1/users", { ctx }),
        log("error", "Connection refused: ECONNREFUSED", { ctx }),
        log("fatal", "Unrecoverable state — shutting down", { ctx }),
      ].join("\n"),
  },
  {
    id: "gradient-text",
    name: "gradientText()",
    subtitle: "Gradient-colored text",
    pkg: "bijou",
    tier: 1,
    description: [
      "# gradientText()",
      "",
      "Apply RGB color gradients to text strings.",
      "",
      "**Degradation:** Rich shows gradient. Pipe/accessible return plain text.",
    ].join("\n"),
    render: (_w, ctx) =>
      [
        gradientText("Hello, beautiful terminal!", { ctx }),
        gradientText("Bijou Component Library", { ctx }),
      ].join("\n"),
  },
];
