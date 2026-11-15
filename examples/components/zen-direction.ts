import { createI18nRuntime, type I18nRuntime } from '../../packages/bijou-i18n/src/index.js';
import { FRAME_I18N_CATALOG } from '../../packages/bijou-tui/src/index.js';
import type { ZenMsg } from './zen-model.js';

/**
 * The reading direction Zen shares with the app frame. The frame reads `direction` from its i18n runtime,
 * which today decides which side drawers and notifications open from; Zen mirrors its own body.
 */
export function createZenI18n(): I18nRuntime {
  return createI18nRuntime({ locale: 'en', direction: 'ltr', catalogs: [FRAME_I18N_CATALOG] });
}

export function setZenDirection(i18n: I18nRuntime, rtl: boolean): void {
  void i18n.setLocale(i18n.locale, rtl ? 'rtl' : 'ltr');
}

/** h/l and the arrows are physical: in RTL the left key moves toward the end of the list. */
export function physical(msg: ZenMsg, rtl: boolean): ZenMsg {
  return rtl && msg.type === 'zen-step' ? { ...msg, delta: -msg.delta } : msg;
}
