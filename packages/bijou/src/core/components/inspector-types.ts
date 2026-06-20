import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { BijouNodeOptions } from './types.js';

export type InspectorSectionTone = 'default' | 'muted';
export type InspectorChrome = 'boxed' | 'none';

/** A compact titled section within an inspector surface. */
export interface InspectorSection {
  /** Section heading shown above the content. */
  readonly title: string;
  /** Section body content. */
  readonly content: string;
  /** Optional tone for the section body. */
  readonly tone?: InspectorSectionTone;
}

/** Options for rendering a canonical inspector surface. */
export interface InspectorOptions extends BijouNodeOptions {
  /** Title shown in the box chrome or as the first plain-text line. */
  readonly title: string;
  /** Optional current selection or active value to emphasize. */
  readonly currentValue?: string;
  /** Visible label for the current value. Defaults to `Current selection`. */
  readonly currentValueLabel?: string;
  /** Optional supporting text immediately beneath the current value. */
  readonly supportingText?: string;
  /** Optional explicit label for supporting text in non-visual modes. Defaults to `Context`. */
  readonly supportingTextLabel?: string;
  /** Compact titled sections shown below the active value. */
  readonly sections?: readonly InspectorSection[];
  /** Visual chrome for rich/static rendering. Defaults to `boxed`. */
  readonly chrome?: InspectorChrome;
  /** Optional border token for the visual surface. */
  readonly borderToken?: TokenValue;
  /** Optional background token for the visual surface. */
  readonly bgToken?: TokenValue;
  /** Optional fixed width for the visual surface. */
  readonly width?: number;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}
