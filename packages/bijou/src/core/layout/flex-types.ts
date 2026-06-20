/**
 * Options for the flex layout engine.
 */
export interface FlexOptions {
  direction?: 'row' | 'column';
  gap?: number;
}

/**
 * Metadata for a flex child.
 */
export interface FlexChildProps {
  id?: string;
  flex?: number;
  basis?: number;
  minSize?: number;
  maxSize?: number;
}
