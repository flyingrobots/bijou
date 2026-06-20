/**
 * Metadata for a component used to match CSS selectors.
 */
export interface ComponentIdentity {
  type?: string;
  id?: string;
  classes?: string[];
}

/**
 * Resolved styles for a component.
 */
export type ResolvedStyles = Record<string, string>;
