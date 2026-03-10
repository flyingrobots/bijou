import type { RenderMiddleware } from '../pipeline.js';
import { parseBCSS } from '../../css/parser.js';
import type { BCSSSheet } from '../../css/types.js';
import { resolveStyles } from '../../css/resolver.js';

/**
 * Creates a BCSS styling middleware for the rendering pipeline.
 * 
 * This middleware resolves CSS rules against component identities
 * and applies them to the render state.
 * 
 * @param css - The BCSS stylesheet string.
 * @returns A RenderMiddleware.
 */
export function bcssMiddleware(css: string): RenderMiddleware {
  let cachedSheet: BCSSSheet | null = null;

  return (state, next) => {
    if (!cachedSheet) {
      cachedSheet = parseBCSS(css);
    }

    // Pass the sheet through the data bag so stages can use it
    state.data['bcss_sheet'] = cachedSheet;

    // The actual application of styles happens within the components 
    // by calling a helper that uses this sheet, OR we can do a global 
    // post-layout pass here.
    
    // For now, we'll just ensure the sheet is available.
    // Future: implement global layout override pass here.

    next();
  };
}

/**
 * Helper for components to resolve their own BCSS styles.
 */
export function useBCSS(state: any, identity: { type: string, id?: string, classes?: string[] }) {
  const sheet = state.data['bcss_sheet'] as BCSSSheet | undefined;
  if (!sheet) return {};

  const terminal = {
    width: state.ctx.runtime.columns,
    height: state.ctx.runtime.rows
  };

  return resolveStyles(identity, sheet, terminal);
}
