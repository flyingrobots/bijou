import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { helpPreview } from './stories-helper-help-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_HELP_VIEW: DogfoodComponentStory = {
    kind: 'component',
    id: 'help-view',
    coverageFamilyIds: ['keybinding-help-and-shell-hints'],
    family: 'Hints and shortcut cues',
    title: 'helpView() / helpShortSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Grouped keyboard reference plus compact shell hint surfaces for keyboard-owned apps that need shortcut discovery without turning every footer into prose.',
      useWhen: [
        'The app is keyboard-owned and the user needs grouped shortcut reference or compact shell hints.',
        'Shortcut discovery should stay distinct from action execution or command search.',
        'Grouped help names can describe jobs like navigation and actions instead of raw input mechanics.',
      ],
      avoidWhen: [
        'The controls are already obvious from context and the help surface would just restate visible labels.',
        'The UI needs discoverable actions or destinations rather than shortcut explanation; prefer the command palette.',
        'The surface is trying to become a general-purpose note or status card.',
      ],
      relatedFamilies: ['kbd()', 'commandPalette()', 'createFramedApp()'],
      gracefulLowering: {
        interactive: 'Compact shell hints and grouped help surfaces stay on the rich TUI path without losing scope or grouping.',
        static: 'Single-frame help snapshots preserve the same grouped reference and shell hint language.',
        pipe: 'Plain text shortcut summaries and grouped help blocks remain readable without rich surface chrome.',
        accessible: 'Help content linearizes into explicit grouped sections with shortcut and action labels kept together.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'shell-hint',
        label: 'Shell hint',
        description: 'Compact footer-style shortcut help stays terse and scoped.',
        render: ({ width, ctx }) => helpPreview({
          width,
          ctx,
          title: 'shell hint',
          mode: 'hint',
        }),
      },
      {
        id: 'grouped-reference',
        label: 'Grouped reference',
        description: 'Full grouped help explains jobs and scope instead of one long hotkey sentence.',
        render: ({ width, ctx }) => helpPreview({
          width,
          ctx,
          title: 'grouped help',
          mode: 'reference',
        }),
      },
    ],
    tags: ['shortcuts', 'help', 'shell'],
  };
