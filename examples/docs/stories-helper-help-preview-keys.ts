import { createKeyMap } from './stories-runtime.js';

export const HELP_PREVIEW_KEYS = createKeyMap<{ readonly type: string }>()
  .group('Navigation', (g) => g
    .bind('j', 'Move down', { type: 'down' })
    .bind('k', 'Move up', { type: 'up' })
    .bind('tab', 'Next pane', { type: 'next-pane' })
  )
  .group('Actions', (g) => g
    .bind('enter', 'Open selection', { type: 'open' })
    .bind('/', 'Search documentation', { type: 'search' })
    .bind('f2', 'Open settings', { type: 'settings' })
  )
  .group('Shell', (g) => g
    .bind('?', 'Open help', { type: 'help' })
    .bind('q', 'Quit', { type: 'quit' })
  );
