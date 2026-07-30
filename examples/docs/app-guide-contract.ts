import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { GuideDocsPageId } from './app-ids.js';

export interface GuideDoc {
  readonly id: string;
  readonly pageId: GuideDocsPageId;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly localizedTitle?: (
    localization: LocalizationPort | undefined,
  ) => string;
  readonly localizedSummary?: (
    localization: LocalizationPort | undefined,
  ) => string;
  readonly localizedBody?: (
    localization: LocalizationPort | undefined,
  ) => string;
}
