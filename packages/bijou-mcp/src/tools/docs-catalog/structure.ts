import type { ToolDocsCatalogEntry } from "./types.js";
import { STRUCTURE_DOCS_CATALOG_PART_01 } from "./structure-part01.js";
import { STRUCTURE_DOCS_CATALOG_PART_02 } from "./structure-part02.js";

export const STRUCTURE_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
  ...STRUCTURE_DOCS_CATALOG_PART_01,
  ...STRUCTURE_DOCS_CATALOG_PART_02,
];
