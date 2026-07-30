import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { progressiveDisclosurePreview } from './stories-helper-progressive-disclosure-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_PROGRESSIVE_DISCLOSURE: DogfoodComponentStory = {
    kind: 'component',
    id: 'progressive-disclosure',
    coverageFamilyIds: ['progressive-disclosure'],
    family: 'Navigation and organization',
    title: 'accordion() / interactiveAccordion()',
    package: 'bijou-tui',
    docs: {
      summary: 'Progressive-disclosure family for scanning summaries first and revealing detail only when the user chooses to open a section.',
      useWhen: [
        'Detail is secondary to summary and the user benefits from scanning section headers first.',
        'Expanded content stays tightly related to one summary row.',
        'The same disclosure story should remain honest in pipe, accessible, and rich modes.',
      ],
      avoidWhen: [
        'The sections are really peer destinations; prefer `tabs()`.',
        'The content is always critical and should not be hidden behind disclosure.',
        'The summary rows are too vague to let the user decide what to expand.',
      ],
      relatedFamilies: ['tabs()', 'box()', 'interactiveAccordion()'],
      gracefulLowering: {
        interactive: 'Expandable sections with keyboard-owned focus for richer inspection.',
        static: 'Deterministic disclosure snapshot preserving expanded and collapsed state.',
        pipe: 'Section headings with disclosed content kept plainly visible in text.',
        accessible: 'Section labels and disclosure state remain explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'summary-first',
        label: 'Summary-first disclosure',
        description: 'Static disclosure keeps summary rows scannable before details unfold.',
        render: ({ width, ctx }) => progressiveDisclosurePreview({
          width,
          ctx,
          title: 'release accordion',
          interactive: false,
        }),
      },
      {
        id: 'keyboard-inspection',
        label: 'Keyboard inspection',
        description: 'The TUI path adds focus ownership without changing the semantic disclosure model.',
        render: ({ width, ctx }) => progressiveDisclosurePreview({
          width,
          ctx,
          title: 'interactive disclosure',
          interactive: true,
        }),
      },
    ],
    tags: ['disclosure', 'accordion', 'navigation'],
  };
