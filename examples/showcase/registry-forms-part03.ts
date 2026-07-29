import { box } from "@flyingrobots/bijou";
import type { ComponentEntry } from "./types.js";

export const FORMS_PART_03: ComponentEntry[] = [
  {
    id: "wizard",
    name: "wizard()",
    subtitle: "Multi-step form orchestration",
    pkg: "bijou",
    tier: 3,
    description: [
      "# wizard()",
      "",
      "Multi-step form with conditional skip logic, back navigation,",
      "and step progress display.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/wizard/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  Step 1 of 3: Account Setup",
          "",
          "  ? Enter username",
          "  > _",
          "",
          "  Next: Profile  |  Then: Review",
        ].join("\n"),
        { width: Math.min(42, w), ctx },
      ),
  },
  {
    id: "group",
    name: "group()",
    subtitle: "Multi-field form group",
    pkg: "bijou",
    tier: 3,
    description: [
      "# group()",
      "",
      "Collects multiple form fields in sequence and returns all values.",
      "",
      "**Interactive component** — run standalone:",
      "",
      "```sh",
      "npx tsx examples/form-group/main.ts",
      "```",
    ].join("\n"),
    render: (w, ctx) =>
      box(
        [
          "  Form Group",
          "",
          "  name:    Alice",
          "  email:   alice@example.com",
          "  role:    Engineer",
          "",
          "  (fields collected sequentially)",
        ].join("\n"),
        { width: Math.min(42, w), ctx },
      ),
  },
];
