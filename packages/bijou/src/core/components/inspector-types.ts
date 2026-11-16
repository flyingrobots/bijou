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
  readonly tone?: InspectorSectionTone | undefined;
}

/** Options for rendering a canonical inspector surface. */
export interface InspectorOptions extends BijouNodeOptions {
  /** Title shown in the box chrome or as the first plain-text line. */
  readonly title: string;
  /** Optional current selection or active value to emphasize. */
  readonly currentValue?: string | undefined;
  /** Visible label for the current value. Defaults to `Current selection`. */
  readonly currentValueLabel?: string | undefined;
  /** Optional supporting text immediately beneath the current value. */
  readonly supportingText?: string | undefined;
  /** Optional explicit label for supporting text in non-visual modes. Defaults to `Context`. */
  readonly supportingTextLabel?: string | undefined;
  /** Compact titled sections shown below the active value. */
  readonly sections?: readonly InspectorSection[] | undefined;
  /** Visual chrome for rich/static rendering. Defaults to `boxed`. */
  readonly chrome?: InspectorChrome | undefined;
  /** Optional border token for the visual surface. */
  readonly borderToken?: TokenValue | undefined;
  /** Optional background token for the visual surface. */
  readonly bgToken?: TokenValue | undefined;
  /** Optional fixed width for the visual surface. */
  readonly width?: number | undefined;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext | undefined;
}
