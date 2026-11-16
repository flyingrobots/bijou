import { createI18nRuntime, type I18nRuntime } from '../../packages/bijou-i18n/src/index.js';
import { FRAME_I18N_CATALOG } from '../../packages/bijou-tui/src/index.js';
import type { LibraryMsg } from './library-model.js';

/**
 * The reading direction the library shares with the app frame. The frame reads `direction` from its i18n runtime,
 * which today decides which side drawers and notifications open from; the library mirrors its own body.
 */
export function createLibraryI18n(): I18nRuntime {
  return createI18nRuntime({ locale: 'en', direction: 'ltr', catalogs: [FRAME_I18N_CATALOG] });
}

export function setLibraryDirection(i18n: I18nRuntime, rtl: boolean): void {
  void i18n.setLocale(i18n.locale, rtl ? 'rtl' : 'ltr');
}

/** h/l, [ ] and the arrows are physical: in RTL the left key moves toward the end of the list. */
export function physical(msg: LibraryMsg, rtl: boolean): LibraryMsg {
  return rtl && (msg.type === 'library-step' || msg.type === 'library-family') ? { ...msg, delta: -msg.delta } : msg;
}
