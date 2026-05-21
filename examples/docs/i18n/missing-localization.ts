import type { I18nMissingMessageContext } from '../../../packages/bijou-i18n/src/index.js';

const MISSING_LOC_STYLE = '\x1b[105;92m';
const ANSI_RESET = '\x1b[0m';

export function dogfoodMissingLocalizationMessage(context: I18nMissingMessageContext): string {
  const marker = `<MISSING LOC STRING KEY=${context.key.namespace}:${context.key.id}>`;
  return `${MISSING_LOC_STYLE}${marker} ${marker} ${marker}${ANSI_RESET}`;
}
