import { CANONICAL_STORY_PROFILE_PRESETS, LONG_DOCUMENT, boxSurface, column, focusedPanePreviewSurface, pagerPreviewSurface, spacer, viewportPreviewSurface } from './stories-runtime.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_VIEWPORT_SURFACE: DogfoodComponentStory = {
    kind: 'component',
    id: 'viewport-surface',
    coverageFamilyIds: ['viewport-masking-and-scrollable-inspection-panes'],
    family: 'Masking and overflow',
    title: 'viewportSurface() / pagerSurface() / focusAreaSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Masking and scrollable-pane family for bounded overflow content, long linear readers, and focused inspection panes without flattening structured surfaces first.',
      useWhen: [
        'A pane needs overflow scrolling while preserving structured surface composition.',
        'A long linear document needs a visible current-line position.',
        'A workspace pane needs focus ownership and gutter chrome.',
        'The child content may be wider or taller than the visible region and should be clipped predictably.',
        'Higher-level widgets like lists, file pickers, and tables need a shared masking primitive.',
      ],
      avoidWhen: [
        'The component needs row-aware semantics beyond simple line clipping; prefer a purpose-built wrapper like `navigableTableSurface()`.',
        'The content is short enough to fit without overflow management.',
        'You are only lowering plain text at the outer boundary; the string helper path is enough there.',
      ],
      relatedFamilies: ['pagerSurface()', 'focusAreaSurface()', 'navigableTableSurface()'],
      gracefulLowering: {
        interactive: 'Rich viewport mask with proportional scrollbar over structured child content.',
        static: 'Single deterministic frame of the same masked region for screenshots and CI.',
        pipe: 'Sequential text with explicit viewport, pager, or focus context instead of hidden interactive regions.',
        accessible: 'Linear pane output with explicit scroll position or focus context when appropriate.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'document',
        label: 'Document',
        description: 'Text-heavy surface clipped through a viewport mask.',
        render: ({ width, ctx }) => viewportPreviewSurface(
          width,
          boxSurface(LONG_DOCUMENT, {
            title: 'release-notes.md',
            width: Math.max(28, width - 1),
            ctx,
          }),
          4,
          ctx,
          ['release-notes.md', 'Build plan', 'Run migrations', 'Promote release'],
        ),
      },
      {
        id: 'structured-stack',
        label: 'Structured stack',
        description: 'Nested surface content proving the viewport is a mask, not a text slicer.',
        render: ({ width, ctx }) => viewportPreviewSurface(
          width,
          column([
            boxSurface('Health checks\n\n- db\n- cache\n- queue', {
              title: 'Signals',
              width: Math.max(24, width - 1),
              ctx,
            }),
            spacer(),
            boxSurface('Warnings\n\n- slow migration\n- stale cache', {
              title: 'Review',
              width: Math.max(24, width - 1),
              ctx,
            }),
            spacer(),
            boxSurface('Next steps\n\n- confirm deploy\n- watch rollout', {
              title: 'Actions',
              width: Math.max(24, width - 1),
              ctx,
            }),
          ]),
          3,
          ctx,
          ['structured stack', 'Signals', 'Review', 'Actions'],
        ),
      },
      {
        id: 'pager-window',
        label: 'Pager window',
        description: 'A long linear document keeps current-line status attached to the visible window.',
        render: ({ width, ctx }) => pagerPreviewSurface(width, ctx),
      },
      {
        id: 'focused-pane',
        label: 'Focused pane',
        description: 'A scrollable inspection pane owns focus chrome without turning the gutter into content.',
        render: ({ width, ctx }) => focusedPanePreviewSurface(width, ctx),
      },
    ],
    tags: ['layout', 'masking', 'scroll'],
  };
