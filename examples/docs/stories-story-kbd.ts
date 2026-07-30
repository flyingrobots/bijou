import { CANONICAL_STORY_PROFILE_PRESETS, column, kbd, line } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_KBD: DogfoodComponentStory = {
    kind: 'component',
    id: 'kbd',
    coverageFamilyIds: ['inline-shortcut-cues'],
    family: 'Hints and shortcut cues',
    title: 'kbd()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Inline shortcut cue for local actions that should stay adjacent to the thing they affect.',
      useWhen: [
        'A nearby action needs a compact keyboard reminder.',
        'The shortcut belongs to one local surface, not the whole shell.',
        'The user benefits from inline discoverability without opening full help.',
      ],
      avoidWhen: [
        'You are trying to document the whole app keymap; prefer shell help or a command surface.',
        'The chip would become the main content instead of a supporting cue.',
        'The shortcut is stale or inactive for the current focus region.',
      ],
      relatedFamilies: ['helpView()', 'commandPalette()', 'note()'],
      gracefulLowering: {
        interactive: 'Compact key-chip treatment inline with the surrounding instruction.',
        static: 'Single-frame key cue preserving the same nearby action language.',
        pipe: 'Plain explicit key names inline with the instruction text.',
        accessible: 'Spoken shortcut and action phrased together in plain text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'local-actions',
        label: 'Local actions',
        description: 'Shortcut cues that stay beside the immediate action instead of moving into shell chrome.',
        render: ({ ctx }) => column([
          line(`${kbd('Enter', { ctx })} Select item`),
          line(`${kbd('Esc', { ctx })} Dismiss panel`),
          line(`${kbd('?', { ctx })} Open help`),
        ]),
      },
      {
        id: 'chords-and-navigation',
        label: 'Chords and navigation',
        description: 'Mixed single keys and chords that still read as one local instruction cluster.',
        render: ({ ctx }) => column([
          line(`${kbd('↑', { ctx })} ${kbd('↓', { ctx })} Browse rows`),
          line(`${kbd('←', { ctx })} ${kbd('→', { ctx })} Switch tabs`),
          line(`${kbd('Cmd', { ctx })} + ${kbd('Shift', { ctx })} + ${kbd('P', { ctx })} Command palette`),
        ]),
      },
    ],
    tags: ['shortcuts', 'inline', 'hints'],
  };
