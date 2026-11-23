import SNIPPET_DATA from './generated/library-snippets.json' with { type: 'json' };

/**
 * story id → per-variant example code, read from the story's own TypeScript
 * source by `npm run components:data` (scripts/components-browser-data.ts).
 */
export const SNIPPETS: ReadonlyMap<string, readonly (readonly string[])[]> = new Map(SNIPPET_DATA.map(({ id, variants }) => [id, variants]));
