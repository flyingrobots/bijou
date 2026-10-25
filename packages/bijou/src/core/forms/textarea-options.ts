import type { FieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';

export interface TextareaOptions extends FieldOptions<string> {
  /** Placeholder text shown when the textarea is empty. */
  placeholder?: string;
  /** Maximum character count (including newlines). */
  maxLength?: number;
  /** Display line numbers in the gutter. Default: false. */
  showLineNumbers?: boolean;
  /** Visible editor height in lines. Default: 6. */
  height?: number;
  /** Render width in columns. Default: 80. */
  width?: number;
  /** Bijou context for IO, styling, and mode detection. */
  ctx?: BijouContext;
}
