import { alert, box, headerBox, separator } from "@flyingrobots/bijou";
import {
  badgeSurface,
  column,
  row,
  spacer,
} from "../_shared/example-surfaces.ts";
import type { ComponentEntry } from "./types.js";

export const DISPLAY_PART_01: ComponentEntry[] = [
  {
    id: "box",
    name: "box() / headerBox()",
    subtitle: "Bordered containers",
    pkg: "bijou",
    tier: 1,
    description: [
      "# box() / headerBox()",
      "",
      "Unicode box-drawing containers with optional titles, padding, width override,",
      "and background surface tokens. `headerBox()` adds a label + detail header.",
      "",
      "**Degradation:** Rich shows borders. Pipe returns content only. Accessible returns content only.",
    ].join("\n"),
    render: (w, ctx) =>
      [
        box("A simple bordered box.", { width: Math.min(40, w), ctx }),
        "",
        headerBox("Deploy", { detail: "v1.2.3 -> production", ctx }),
      ].join("\n"),
  },
  {
    id: "alert",
    name: "alert()",
    subtitle: "Boxed alerts with icons",
    pkg: "bijou",
    tier: 1,
    description: [
      "# alert()",
      "",
      "Boxed notification alerts with status icons and variant coloring.",
      "Variants: `info`, `success`, `warning`, `error`.",
      "",
      "**Degradation:** Rich shows bordered box with icon. Pipe/accessible show text with prefix.",
    ].join("\n"),
    render: (w, ctx) =>
      [
        alert("Deployment successful.", { variant: "success", ctx }),
        "",
        alert("Check your configuration.", { variant: "warning", ctx }),
        "",
        alert("Connection refused on port 5432.", { variant: "error", ctx }),
      ].join("\n"),
  },
  {
    id: "badge",
    name: "badge()",
    subtitle: "Inline status badges (7 variants)",
    pkg: "bijou",
    tier: 1,
    description: [
      "# badge()",
      "",
      "Compact inline status indicators. Inverse-colored pills.",
      "Variants: `success`, `error`, `warning`, `info`, `muted`, `accent`, `primary`.",
      "",
      "**Degradation:** Rich shows colored pill. Pipe shows plain text. Accessible shows `[TEXT]` brackets.",
    ].join("\n"),
    render: (_w, ctx) =>
      column([
        row([
          badgeSurface("SUCCESS", "success", ctx),
          "  ",
          badgeSurface("ERROR", "error", ctx),
          "  ",
          badgeSurface("WARNING", "warning", ctx),
        ]),
        row([
          badgeSurface("INFO", "info", ctx),
          "  ",
          badgeSurface("MUTED", "muted", ctx),
          "  ",
          badgeSurface("ACCENT", "accent", ctx),
          "  ",
          badgeSurface("PRIMARY", "primary", ctx),
        ]),
        spacer(1, 1),
        row([
          "Server is ",
          badgeSurface("RUNNING", "success", ctx),
          " on port ",
          badgeSurface("3000", "primary", ctx),
        ]),
      ]),
  },
  {
    id: "separator",
    name: "separator()",
    subtitle: "Horizontal dividers with labels",
    pkg: "bijou",
    tier: 1,
    description: [
      "# separator()",
      "",
      "Horizontal rule dividers with optional centered labels.",
      "",
      "**Degradation:** Rich shows styled line. Pipe shows dashes. Accessible shows dashes.",
    ].join("\n"),
    render: (w, ctx) =>
      [
        separator({ width: Math.min(40, w), ctx }),
        "",
        separator({ label: "Section Title", width: Math.min(40, w), ctx }),
        "",
        separator({ label: "Another", width: Math.min(40, w), ctx }),
      ].join("\n"),
  },
];
