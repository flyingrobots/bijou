import { box } from "@flyingrobots/bijou";
import { statusBarSurface } from "@flyingrobots/bijou-tui";
import type { ComponentEntry } from "./types.js";

export const TUI_PART_03: ComponentEntry[] = [
  {
    id: "modal",
    name: "modal()",
    subtitle: "Centered dialog overlay",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# modal()",
      "",
      "Centered overlay dialog with title, body, hint text,",
      "themed borders, and background token. Composited via `composite()`.",
      "",
      "**Embeddable** — used in `overlayFactory` of `createFramedApp`.",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "         Confirm Action",
          "",
          "  Are you sure you want to proceed?",
          "",
          "     Enter = Yes   Esc = No",
        ].join("\n"),
        {
          width: Math.min(42, w),
          borderToken: ctx.border("primary"),
          ctx,
        },
      ),
  },
  {
    id: "toast",
    name: "toast()",
    subtitle: "Anchored notification overlay",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# toast()",
      "",
      "Corner-anchored notification with success/error/info variants.",
      "Auto-dismissing with configurable duration. 4-corner anchoring.",
      "",
      "**Embeddable** — used in `overlayFactory`.",
    ].join("\n"),
    render: (w, ctx) =>
      [
        box("  Saved successfully!", {
          width: Math.min(30, w),
          borderToken: ctx.border("primary"),
          ctx,
        }),
        box("  Error: connection lost", {
          width: Math.min(30, w),
          borderToken: ctx.border("warning"),
          ctx,
        }),
      ].join("\n"),
  },
  {
    id: "drawer",
    name: "drawer()",
    subtitle: "Slide-in side panel",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# drawer()",
      "",
      "Slide-in panel overlay anchored to left/right/top/bottom edges.",
      "Configurable width/height. Supports region-scoped attachment to",
      "individual panes.",
      "",
      "**Embeddable** — used in `overlayFactory`.",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  Drawer Panel",
          "",
          "  - Navigation item 1",
          "  - Navigation item 2",
          "  - Navigation item 3",
          "",
          "  o toggle  a anchor",
        ].join("\n"),
        { width: Math.min(30, w), borderToken: ctx.border("primary"), ctx },
      ),
  },
  {
    id: "status-bar",
    name: "statusBar()",
    subtitle: "Left/right justified status",
    pkg: "bijou-tui",
    tier: 1,
    description: [
      "# statusBar()",
      "",
      "Single-line status rail with left, center, and right segments.",
      "Use `statusBarSurface()` when shell chrome stays on the structured surface path.",
    ].join("\n"),
    render: () =>
      statusBarSurface({
        left: " NORMAL",
        center: "TypeScript",
        right: "Ln 42, Col 8 ",
        width: 40,
      }),
  },
];
