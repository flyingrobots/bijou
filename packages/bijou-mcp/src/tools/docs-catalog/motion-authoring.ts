import type { ToolDocsCatalogEntry } from "./types.js";

export const MOTION_AUTHORING_DOCS: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: "bijou_branding",
    family: "loadRandomLogo() / gradientText()",
    category: "Narrative and Content",
    summary:
      "Expressive branding helpers for deliberate splash, celebratory, and docs-opening moments.",
    aliases: ["branding", "logo", "gradient text", "splash", "hero"],
    useWhen: [
      "The interface needs a deliberate branded or celebratory moment.",
      "Expressive emphasis helps open or orient the experience without carrying critical state.",
    ],
    avoidWhen: [
      "Routine app chrome or task-critical labels need maximum scanability.",
      "Decoration would compete with the actual work or hide meaning behind color.",
    ],
    related: ["markdown()", "box()", "renderByMode()"],
    exampleArgs: {
      logo: "BIJOU",
      headline: "Release ready",
    },
  },
  {
    toolName: "bijou_mode_aware_authoring",
    family: "renderByMode()",
    category: "Utility",
    summary:
      "Authoring helper for building one semantic primitive that lowers honestly across output modes.",
    aliases: [
      "renderByMode",
      "mode-aware primitive",
      "custom primitive",
      "lowering",
    ],
    useWhen: [
      "An app needs a domain-specific primitive that does not belong in the shared component catalog.",
      "The same semantic thing must lower honestly across interactive, pipe, and accessible modes.",
    ],
    avoidWhen: [
      "An existing Bijou family already matches the job.",
      "Mode branching would only chase cosmetics instead of preserving meaning.",
    ],
    related: ["note()", "badge()", "markdown()"],
    exampleArgs: {
      semanticThing: "build health",
      interactive: "[build][healthy]",
      pipe: "build health: healthy",
      accessible: "Build health is healthy.",
    },
  },
];
