import { type ChalkInstance } from 'chalk';
import type { TokenValue } from './tokens.js';
/**
 * Creates a chalk instance from a theme token.
 *
 * - When NO_COLOR is set, hex coloring is skipped but modifiers (bold/dim/strikethrough) still apply.
 * - chalk v5 also respects NO_COLOR natively, providing double safety.
 */
export declare function chalkFromToken(token: TokenValue): ChalkInstance;
/** Apply a theme token to a string. Convenience wrapper around chalkFromToken. */
export declare function styled(token: TokenValue, text: string): string;
/** Apply a status-key token to a string. Falls back to 'muted' if status is not recognized. */
export declare function styledStatus(status: string, text?: string): string;
//# sourceMappingURL=chalk-adapter.d.ts.map