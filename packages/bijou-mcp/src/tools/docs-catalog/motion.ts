import type { ToolDocsCatalogEntry } from "./types.js";
import { MOTION_AUTHORING_DOCS } from "./motion-authoring.js";
import { MOTION_FEEDBACK_DOCS } from "./motion-feedback.js";
import { MOTION_VISUALIZATION_DOCS } from "./motion-visualization.js";

export const MOTION_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
  ...MOTION_FEEDBACK_DOCS,
  ...MOTION_VISUALIZATION_DOCS,
  ...MOTION_AUTHORING_DOCS,
];
