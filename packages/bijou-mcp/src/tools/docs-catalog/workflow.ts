import type { ToolDocsCatalogEntry } from "./types.js";
import { WORKFLOW_DOCS_CATALOG_PART_01 } from "./workflow-part01.js";
import { WORKFLOW_DOCS_CATALOG_PART_02 } from "./workflow-part02.js";

export const WORKFLOW_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
  ...WORKFLOW_DOCS_CATALOG_PART_01,
  ...WORKFLOW_DOCS_CATALOG_PART_02,
];
