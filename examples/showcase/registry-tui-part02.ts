import { box, dag } from "@flyingrobots/bijou";
import { SAMPLE_DAG } from "./registry-samples.js";
import type { ComponentEntry } from "./types.js";

export const TUI_PART_02: ComponentEntry[] = [
  {
    id: "dag-pane",
    name: "dagPane()",
    subtitle: "Interactive DAG viewer",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# dagPane()",
      "",
      "2D DAG viewer with node navigation (parent/child/sibling),",
      "scroll, and selection tracking. Wraps `dag()` + `focusArea()`.",
      "",
      "**Embeddable** — composable in any TEA app.",
    ].join("\n"),
    render: (w, ctx) =>
      dag(SAMPLE_DAG, {
        selectedId: "dev",
        maxWidth: Math.max(40, w),
        ctx,
      }),
  },
  {
    id: "command-palette",
    name: "commandPalette()",
    subtitle: "Filterable action list",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# commandPalette()",
      "",
      "Searchable action list with live filtering. Type to filter,",
      "arrows to navigate, Enter to select.",
      "",
      "**Embeddable** — built into `createFramedApp` via ctrl+p.",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  > open fi_",
          "",
          "  > Open File         ctrl+o",
          "    Open Folder       ctrl+shift+o",
          "    Open Recent       ctrl+r",
        ].join("\n"),
        { width: Math.min(44, w), ctx },
      ),
  },
  {
    id: "canvas",
    name: "canvas()",
    subtitle: "Shader-based character grid",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# canvas()",
      "",
      "Character-grid renderer driven by a shader function.",
      "`(x, y, cols, rows, time?) => character`. Used for transitions,",
      "visual effects, and procedural patterns.",
      "",
      "**Embeddable** — runs on `tick()` for animation.",
    ].join("\n"),
    render: (w, ctx) => {
      const cols = Math.min(30, w - 4);
      const rows = 6;
      const lines: string[] = [];
      for (let y = 0; y < rows; y++) {
        let line = "";
        for (let x = 0; x < cols; x++) {
          const v = Math.sin(x * 0.3 + y * 0.5) * 0.5 + 0.5;
          line += v > 0.7 ? "#" : v > 0.4 ? "+" : v > 0.2 ? "." : " ";
        }
        lines.push(line);
      }
      return box(lines.join("\n"), { width: Math.min(cols + 4, w), ctx });
    },
  },
  {
    id: "split-pane",
    name: "splitPane()",
    subtitle: "Resizable split layout",
    pkg: "bijou-tui",
    tier: 2,
    description: [
      "# splitPane()",
      "",
      "Stateful split-pane layout (horizontal or vertical) with",
      "focus management, resize controls, and min-width/height constraints.",
      "",
      "**Embeddable** — composable in `createFramedApp` layouts.",
    ].join("\n"),
    render: (w, ctx) => {
      const hw = Math.min(18, Math.floor((w - 5) / 2));
      const left = box("Left pane", { width: hw, ctx });
      const right = box("Right pane", { width: hw, ctx });
      const lLines = left.split("\n");
      const rLines = right.split("\n");
      const maxH = Math.max(lLines.length, rLines.length);
      const lines: string[] = [];
      for (let i = 0; i < maxH; i++) {
        lines.push(`${lLines[i] ?? ""} | ${rLines[i] ?? ""}`);
      }
      return lines.join("\n");
    },
  },
];
