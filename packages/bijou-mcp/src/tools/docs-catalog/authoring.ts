import type { ToolDocsCatalogEntry } from "./types.js";
import { AUTHORING_DOCS_CATALOG_PART_01 } from "./authoring-part01.js";
import { AUTHORING_DOCS_CATALOG_PART_02 } from "./authoring-part02.js";

export const AUTHORING_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
  ...AUTHORING_DOCS_CATALOG_PART_01,
  ...AUTHORING_DOCS_CATALOG_PART_02,
];
