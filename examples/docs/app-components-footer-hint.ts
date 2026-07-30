import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { dogfoodText } from './app-localization.js';

export function componentsFooterHint(
  focusedPane: string | undefined,
  story: ComponentStory | undefined,
  paneSwitch: string,
  localization: LocalizationPort,
): string | undefined {
  switch (focusedPane) {
    case 'family-nav':
      return dogfoodText(
        localization,
        'docs.footer.family',
        '{paneSwitch} • ↑/↓ browse • Enter open • ←/→ collapse/expand',
        { paneSwitch },
      );
    case 'story-content':
      return dogfoodText(
        localization,
        'docs.footer.story',
        '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
        { paneSwitch },
      );
    case 'story-variants':
      return story == null
        ? paneSwitch
        : dogfoodText(
            localization,
            'docs.footer.variants',
            '{paneSwitch} • ↑/↓ variant • ,/. cycle • 1-4 profiles',
            { paneSwitch },
          );
    case undefined:
    default:
      return undefined;
  }
}
