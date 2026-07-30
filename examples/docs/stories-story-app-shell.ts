import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { appShellPreview } from './stories-helper-app-shell-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_APP_SHELL: DogfoodComponentStory = {
    kind: 'component',
    id: 'app-shell',
    coverageFamilyIds: ['app-shell'],
    family: 'Shell and workspace',
    title: 'createFramedApp() / statusBarSurface() / commandPaletteSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'App-shell family for multi-view framed applications with global status, command discovery, overlays, and consistent shell-owned chrome.',
      useWhen: [
        'The app has multiple pages, overlays, or global shell concerns.',
        'Status context and action discovery should stay distinct from in-page content.',
        'The shell needs to frame workspace state without becoming a dumping ground for unrelated metadata.',
      ],
      avoidWhen: [
        'The app is really a single screen or one prompt.',
        'Status bars or command palettes would only duplicate obvious local labels.',
        'The surface needs record browsing rather than action discovery; prefer `browsableListSurface()`.',
      ],
      relatedFamilies: ['statusBarSurface()', 'helpViewSurface()', 'commandPaletteSurface()', 'tabs()'],
      gracefulLowering: {
        interactive: 'Full shell chrome keeps status, navigation, and command discovery distinct from page content.',
        static: 'The active page and essential shell context remain visible in one deterministic frame.',
        pipe: 'Current page content plus minimal shell context stays readable without pretending background interactivity exists.',
        accessible: 'Shell state, overlays, and active context linearize into one readable flow.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'framed-page',
        label: 'Framed page',
        description: 'Status rails and framed page content create calm global context around the current workspace.',
        render: ({ width, ctx }) => appShellPreview({
          width,
          ctx,
          title: 'framed shell',
          mode: 'shell',
        }),
      },
      {
        id: 'command-discovery',
        label: 'Command discovery',
        description: 'The palette should surface actions and destinations, not become a record browser in disguise.',
        render: ({ width, ctx }) => appShellPreview({
          width,
          ctx,
          title: 'command palette',
          mode: 'palette',
        }),
      },
    ],
    source: {
      examplePath: 'examples/app-frame/main.ts',
      snippetLabel: 'Framed app shell',
    },
    tags: ['shell', 'status-bar', 'command-palette'],
  };
