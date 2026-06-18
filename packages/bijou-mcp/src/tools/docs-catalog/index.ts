import { AUTHORING_DOCS_CATALOG } from './authoring.js';
import { MOTION_DOCS_CATALOG } from './motion.js';
import { STRUCTURE_DOCS_CATALOG } from './structure.js';
import { WORKFLOW_DOCS_CATALOG } from './workflow.js';
export { DEFAULT_DOCS_ONLY_INTERACTION_PROFILES, DEFAULT_INTERACTION_PROFILES } from './types.js';
export type { ToolDocsCatalogEntry, ToolInteractionProfiles } from './types.js';

export const MCP_DOCS_CATALOG = Object.freeze([
  ...STRUCTURE_DOCS_CATALOG,
  ...WORKFLOW_DOCS_CATALOG,
  ...AUTHORING_DOCS_CATALOG,
  ...MOTION_DOCS_CATALOG,
]);
