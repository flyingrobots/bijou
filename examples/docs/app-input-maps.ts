import {
  createKeyMap,
  type KeyMapGroup,
} from '../../packages/bijou-tui/src/index.js';
import type { ExplorerMsg } from './app-model.js';

const INCREASE_COUNTER_LABEL = 'Increase counter';
const DECREASE_COUNTER_LABEL = 'Decrease counter';
const INCREMENT_COUNTER: ExplorerMsg = {
  type: 'counter-block-intent',
  action: 'increment',
};
const DECREMENT_COUNTER: ExplorerMsg = {
  type: 'counter-block-intent',
  action: 'decrement',
};

const addGuidePaneBindings = (
  group: KeyMapGroup<ExplorerMsg>,
): KeyMapGroup<ExplorerMsg> =>
  group
    .bind('down', 'Next guide', { type: 'guide-next' })
    .bind('up', 'Previous guide', { type: 'guide-prev' })
    .bind('pagedown', 'Page down', { type: 'guide-page-down' })
    .bind('pageup', 'Page up', { type: 'guide-page-up' })
    .bind('enter', 'Open guide', { type: 'activate-guide' })
    .bind('space', 'Open guide', { type: 'activate-guide' });

export const familyPaneKeys = createKeyMap<ExplorerMsg>().group(
  'Families',
  (group) =>
    group
      .bind('down', 'Next row', { type: 'family-next' })
      .bind('up', 'Previous row', { type: 'family-prev' })
      .bind('pagedown', 'Page down', { type: 'family-page-down' })
      .bind('pageup', 'Page up', { type: 'family-page-up' })
      .bind('enter', 'Expand or select', { type: 'activate-row' })
      .bind('space', 'Expand or select', { type: 'activate-row' })
      .bind('right', 'Expand family', { type: 'expand-row' })
      .bind('left', 'Collapse family', { type: 'collapse-row' }),
);

export const variantPaneKeys = createKeyMap<ExplorerMsg>().group(
  'Variants',
  (group) =>
    group
      .bind('down', 'Next variant', { type: 'variant-next' })
      .bind('up', 'Previous variant', { type: 'variant-prev' })
      .bind('pagedown', 'Next variant', { type: 'variant-next' })
      .bind('pageup', 'Previous variant', { type: 'variant-prev' }),
);

export const guidePaneKeys = createKeyMap<ExplorerMsg>().group(
  'Guides',
  addGuidePaneBindings,
);

export const counterBlockGuidePaneKeys = createKeyMap<ExplorerMsg>()
  .group('Guides', addGuidePaneBindings)
  .group('Counter fixture', (group) =>
    group
      .bind('-', DECREASE_COUNTER_LABEL, DECREMENT_COUNTER)
      .bind('+', INCREASE_COUNTER_LABEL, INCREMENT_COUNTER)
      .bind('=', INCREASE_COUNTER_LABEL, INCREMENT_COUNTER),
  );

export const componentsPageKeys = createKeyMap<ExplorerMsg>()
  .group('Profile', (group) =>
    group
      .bind('1', 'Interactive profile', {
        type: 'set-profile',
        mode: 'interactive',
      })
      .bind('2', 'Static profile', { type: 'set-profile', mode: 'static' })
      .bind('3', 'Pipe profile', { type: 'set-profile', mode: 'pipe' })
      .bind('4', 'Accessible profile', {
        type: 'set-profile',
        mode: 'accessible',
      }),
  )
  .group('Variants', (group) =>
    group
      .bind('.', 'Next variant', { type: 'variant-next' })
      .bind(',', 'Previous variant', { type: 'variant-prev' }),
  );

export const counterBlockPreviewPaneKeys = createKeyMap<ExplorerMsg>().group(
  'Counter fixture',
  (group) =>
    group
      .bind('-', DECREASE_COUNTER_LABEL, DECREMENT_COUNTER)
      .bind('+', INCREASE_COUNTER_LABEL, INCREMENT_COUNTER)
      .bind('=', INCREASE_COUNTER_LABEL, INCREMENT_COUNTER),
);
