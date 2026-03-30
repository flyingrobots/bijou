import type { BijouContext } from '@flyingrobots/bijou';
import {
  alert,
  boxSurface,
  kbd,
  progressBar,
  separatorSurface,
  skeleton,
  spinnerFrame,
  type Surface,
} from '@flyingrobots/bijou';
import {
  compositeSurface,
  modal,
  viewportSurface,
} from '@flyingrobots/bijou-tui';
import {
  badgeSurface,
  column,
  contentSurface,
  line,
  row,
  screenSurface,
  spacer,
  textSurface,
} from '../_shared/example-surfaces.js';
import {
  CANONICAL_STORY_PROFILE_PRESETS,
  type ComponentStory,
} from '../_stories/protocol.js';

export interface DogfoodComponentStory<State = void> extends ComponentStory<State> {
  readonly coverageFamilyIds: readonly string[];
}

function modalBackdrop(width: number, ctx: BijouContext): Surface {
  const innerWidth = Math.max(28, width - 4);
  const content = textSurface([
    'Release queue',
    '',
    '  web',
    '  api',
    '  workers',
    '',
    `  ${kbd('d', { ctx })} deploy  ${kbd('?', { ctx })} help  ${kbd('q', { ctx })} quit`,
  ].join('\n'), Math.max(1, innerWidth - 2), 12);
  const fullHeightPanel = boxSurface(content, {
    title: 'release-workbench',
    width: innerWidth,
    ctx,
  });
  return screenSurface(width, 14, fullHeightPanel);
}

function viewportPreviewSurface(
  width: number,
  content: string | Surface,
  scrollY: number,
  ctx: BijouContext,
): Surface {
  const viewportWidth = Math.max(24, width);
  const header = separatorSurface({ label: 'viewport mask', width: viewportWidth, ctx });
  const body = viewportSurface({
    width: viewportWidth,
    height: 9,
    content,
    scrollY,
    showScrollbar: true,
  });
  return column([
    header,
    body,
    line(`  scrollY=${scrollY}  width=${viewportWidth}`, viewportWidth),
  ]);
}

const LONG_DOCUMENT = [
  'Build plan',
  '',
  '1. Resolve dependencies',
  '2. Run migrations',
  '3. Bake artifacts',
  '4. Roll canaries',
  '5. Promote release',
  '',
  'Each stage emits its own frame and can be replayed later.',
  '',
  'The viewport story is intentionally width-sensitive so the docs app can',
  'prove clipping, masking, and scroll-state behavior without a separate demo.',
].join('\n');

function loopingProgressPercent(timeMs: number, offsetMs = 0, cycleMs = 2_800): number {
  const normalized = (((timeMs + offsetMs) % cycleMs) + cycleMs) % cycleMs;
  const phase = normalized / cycleMs;
  const pingPong = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
  return Math.round(pingPong * 100);
}

export const COMPONENT_STORIES: readonly DogfoodComponentStory[] = [
  {
    kind: 'component',
    id: 'alert',
    coverageFamilyIds: ['in-flow-status-block'],
    family: 'Status and in-flow feedback',
    title: 'alert()',
    package: 'bijou',
    docs: {
      summary: 'Persistent in-flow status block for success, warning, error, and informational state that should remain part of the page instead of floating above it.',
      useWhen: [
        'A page or form needs a status callout that should stay visible while the user continues reading nearby content.',
        'You need an honest escalation step above `note()` but below shell-managed notifications or blocking overlays.',
        'The message needs graceful lowering across interactive, static, pipe, and accessible modes.',
      ],
      avoidWhen: [
        'The message is transient and should disappear on its own; prefer `toast()` or the notification system.',
        'The user must respond before continuing; prefer `modal()` or a confirmation flow.',
        'The content is purely decorative or ambient and does not change decision-making.',
      ],
      relatedFamilies: ['note()', 'toast()', 'renderNotificationStack()'],
      gracefulLowering: {
        interactive: 'Styled bordered block with a status icon and elevated background.',
        static: 'Single-frame bordered block with the same semantic iconography but no animation.',
        pipe: 'Bracketed status prefix like `[ERROR] message`.',
        accessible: 'Plain spoken prefix like `Error: message`.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'success',
        label: 'Success',
        description: 'Positive completion that should stay attached to the current task.',
        render: ({ ctx }) => alert('Deployment completed successfully.', { variant: 'success', ctx }),
      },
      {
        id: 'warning',
        label: 'Warning',
        description: 'The user can continue, but only after reading the caution.',
        render: ({ ctx }) => alert('Migrations are queued behind a schema lock. Review the rollout window.', {
          variant: 'warning',
          ctx,
        }),
      },
      {
        id: 'error',
        label: 'Error',
        description: 'The flow should stop until the user understands the failure.',
        render: ({ ctx }) => alert('Release failed: 3 workers did not acknowledge the new image.', {
          variant: 'error',
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/alert/main.ts',
      snippetLabel: 'Alert basics',
    },
    tags: ['status', 'feedback', 'lowering'],
  },
  {
    kind: 'component',
    id: 'badge',
    coverageFamilyIds: ['inline-status'],
    family: 'Status and in-flow feedback',
    title: 'badge()',
    package: 'bijou',
    docs: {
      summary: 'Compact inline status label for states that belong beside another object instead of becoming their own block.',
      useWhen: [
        'A state needs to stay attached to a row, heading, or summary instead of interrupting the layout.',
        'The label can stay short, stable, and glanceable.',
        'You need lightweight semantic emphasis that still lowers honestly outside rich mode.',
      ],
      avoidWhen: [
        'The message needs explanation or next-step guidance; prefer `alert()` or `note()`.',
        'The content is long enough to become a sentence instead of a label.',
        'The user must acknowledge the state before continuing.',
      ],
      relatedFamilies: ['alert()', 'note()', 'notification system'],
      gracefulLowering: {
        interactive: 'Compact themed inline chip that stays attached to the owning object.',
        static: 'Single-frame inline chip preserving the same terse label.',
        pipe: 'Plain inline text status label without depending on color.',
        accessible: 'Explicit spoken status next to the owning object in plain language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'service-health',
        label: 'Service health',
        description: 'Inline status labels attached to operational rows instead of detached callouts.',
        render: ({ ctx }) => column([
          row(['api    ', badgeSurface('LIVE', 'success', ctx), '  p95 84ms']),
          spacer(),
          row(['queue  ', badgeSurface('DEGRADED', 'warning', ctx), '  backlog 12']),
          spacer(),
          row(['cron   ', badgeSurface('PAUSED', 'muted', ctx), '  waiting for window']),
        ]),
      },
      {
        id: 'release-metadata',
        label: 'Release metadata',
        description: 'Short supporting labels that belong inline with other metadata.',
        render: ({ ctx }) => column([
          row([
            badgeSurface('v4.0.0', 'accent', ctx),
            ' ',
            badgeSurface('MIT', 'muted', ctx),
            ' ',
            badgeSurface('TypeScript', 'info', ctx),
          ]),
          spacer(),
          row([
            'Server is ',
            badgeSurface('RUNNING', 'success', ctx),
            ' on port ',
            badgeSurface('3000', 'primary', ctx),
          ]),
        ]),
      },
    ],
    source: {
      examplePath: 'examples/badge/main.ts',
      snippetLabel: 'Inline status labels',
    },
    tags: ['status', 'inline', 'labels'],
  },
  {
    kind: 'component',
    id: 'modal',
    coverageFamilyIds: ['overlay-primitives'],
    family: 'Overlays and interruption',
    title: 'modal()',
    package: 'bijou-tui',
    docs: {
      summary: 'Centered blocking dialog for decisions that should temporarily own attention and input inside a TUI surface.',
      useWhen: [
        'The user must acknowledge or answer before the rest of the surface should accept more input.',
        'The dialog content is short, focused, and directly tied to the current surface state.',
        'You need shell-owned interruption, not a long-lived inspector or sidecar workspace.',
      ],
      avoidWhen: [
        'The content is supplemental and can live beside the main task; prefer `drawer()`.',
        'The message is low-severity and transient; prefer `toast()` or the notification stack.',
        'The body is long-form documentation or persistent inspection chrome.',
      ],
      relatedFamilies: ['drawer()', 'tooltip()', 'toast()'],
      gracefulLowering: {
        interactive: 'Centered bordered overlay dimming the background and temporarily owning input focus.',
        static: 'Single-frame snapshot of the blocking dialog for deterministic screenshots and CI.',
        pipe: 'Recommended lowering is an in-flow confirmation prompt or status note rather than a floating overlay.',
        accessible: 'Recommended lowering is explicit linear confirmation text with direct action language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'confirm',
        label: 'Confirm deploy',
        description: 'Short blocking decision with explicit yes/no guidance.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Confirm deploy',
            body: column([
              line('Deploy release-control to production?'),
              spacer(),
              line('This will roll all workers and re-open the queue.'),
            ]),
            hint: line(`${kbd('y', { ctx })} yes • ${kbd('n', { ctx })} no • ${kbd('esc', { ctx })} cancel`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
      {
        id: 'help',
        label: 'Shortcut help',
        description: 'Small focused explanation for the current surface, not a full settings page.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Keyboard help',
            body: column([
              line(`${kbd('j', { ctx })} ${kbd('k', { ctx })}  Move between stories`),
              line(`${kbd('1', { ctx })}…${kbd('4', { ctx })}  Switch profile`),
              line(`${kbd(',', { ctx })} ${kbd('.', { ctx })}  Cycle variants`),
            ]),
            hint: line(`Press ${kbd('esc', { ctx })} to return to the page`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
    ],
    source: {
      examplePath: 'examples/modal/main.ts',
      snippetLabel: 'Blocking decision overlay',
    },
    tags: ['overlay', 'interruption', 'surface'],
  },
  {
    kind: 'component',
    id: 'progress-bar',
    coverageFamilyIds: ['progress-indicators'],
    family: 'Progress and loading',
    title: 'progressBar()',
    package: 'bijou',
    docs: {
      summary: 'Honest determinate progress indicator for work that can report a real completion percentage, with related support for indeterminate activity cues.',
      useWhen: [
        'The user needs clear feedback that work is ongoing and you can estimate percent-complete honestly.',
        'A task spans long enough that progress feedback helps more than it distracts.',
        'You want the task label and the progress indicator to stay visibly attached.',
      ],
      avoidWhen: [
        'The work is so brief that the indicator would flicker more than it helps.',
        'The state is better explained as a durable note, alert, or completion result.',
        'You do not know progress honestly; prefer an indeterminate spinner or explicit loading text.',
      ],
      relatedFamilies: ['skeleton()', 'badge()', 'notification system'],
      gracefulLowering: {
        interactive: 'Determinate bars and indeterminate activity cues stay visible with real motion only where motion is actually available.',
        static: 'Single deterministic frame preserving the same label and completion state without fake animation.',
        pipe: 'Explicit text progress like `Progress: 42%` or repeated status lines without pretending to animate.',
        accessible: 'Plain language announcing task, progress, and completion state explicitly.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-milestones',
        label: 'Release milestones',
        description: 'Static determinate checkpoints for work whose completion percentage is known.',
        render: ({ ctx }) => boxSurface(column([
          line(`Compile     ${progressBar(18, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Canaries    ${progressBar(46, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Artifacts   ${progressBar(73, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Promote     ${progressBar(100, { width: 28, showPercent: true, ctx })}`),
        ]), {
          title: 'release pipeline',
          width: 48,
          ctx,
        }),
      },
      {
        id: 'looping-rollout',
        label: 'Looping rollout',
        description: 'Looping progress previews prove pulse-driven motion without requiring a separate story runtime.',
        render: ({ ctx, timeMs }) => {
          const rollout = loopingProgressPercent(timeMs, 0);
          const canaries = loopingProgressPercent(timeMs, 700);
          const assets = loopingProgressPercent(timeMs, 1_300);
          const spinnerTick = Math.floor(timeMs / 90);
          return boxSurface(column([
            line(`Rollout    ${progressBar(rollout, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Canaries   ${progressBar(canaries, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Assets     ${progressBar(assets, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Watch      ${spinnerFrame(spinnerTick, { label: 'waiting for verification window', ctx })}`),
          ]), {
            title: 'looping rollout monitor',
            width: 56,
            ctx,
          });
        },
      },
    ],
    source: {
      examplePath: 'examples/progress-animated/main.ts',
      snippetLabel: 'Looping rollout progress',
    },
    tags: ['progress', 'loading', 'animation'],
  },
  {
    kind: 'component',
    id: 'skeleton',
    coverageFamilyIds: ['loading-placeholders'],
    family: 'Progress and loading',
    title: 'skeleton()',
    package: 'bijou',
    docs: {
      summary: 'Shape-preserving loading placeholder for short-lived uncertainty when you know the information layout but not the data yet.',
      useWhen: [
        'The final content shape is known and preserving layout stability helps more than a separate loading page.',
        'The loading window is short enough that a placeholder remains believable.',
        'The surrounding labels can stay explicit so the user knows what is loading.',
      ],
      avoidWhen: [
        'Real partial content can already be shown honestly.',
        'The delay is long enough that a clearer progress indicator, retry path, or durable message is needed.',
        'The placeholder would become decorative filler instead of a faithful stand-in for the final layout.',
      ],
      relatedFamilies: ['progressBar()', 'spinnerFrame()', 'note()'],
      gracefulLowering: {
        interactive: 'Placeholder bars preserve approximate content shape while loading is genuinely transient.',
        static: 'Single deterministic placeholder frame with the same layout footprint.',
        pipe: 'Explicit loading text or field labels instead of decorative placeholder bars.',
        accessible: 'Plain loading-state language describing the affected region instead of relying on shape alone.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'form-shell',
        label: 'Form shell',
        description: 'Short-lived placeholders that preserve a known form layout without implying fake text.',
        render: ({ ctx }) => boxSurface(column([
          line('Name'),
          contentSurface(skeleton({ width: 26, ctx })),
          spacer(),
          line('Description'),
          contentSurface(skeleton({ width: 34, lines: 3, ctx })),
          spacer(),
          line('Owner'),
          contentSurface(skeleton({ width: 18, ctx })),
        ]), {
          title: 'new package',
          width: 40,
          ctx,
        }),
      },
      {
        id: 'card-region',
        label: 'Card region',
        description: 'Region-shaped placeholders that match the density of a summary card instead of spraying generic bars everywhere.',
        render: ({ ctx }) => boxSurface(column([
          line('Package summary'),
          spacer(),
          contentSurface(skeleton({ width: 32, lines: 2, ctx })),
          spacer(),
          line('Recent activity'),
          contentSurface(skeleton({ width: 28, lines: 3, ctx })),
        ]), {
          title: 'registry overview',
          width: 38,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/skeleton/main.ts',
      snippetLabel: 'Loading placeholders',
    },
    tags: ['loading', 'placeholder', 'layout'],
  },
  {
    kind: 'component',
    id: 'viewport-surface',
    coverageFamilyIds: ['viewport-masking-and-scrollable-inspection-panes'],
    family: 'Masking and overflow',
    title: 'viewportSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Masking wrapper for overflow content that clips a larger surface into a scrollable window without flattening the child first.',
      useWhen: [
        'A pane needs overflow scrolling while preserving structured surface composition.',
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
        pipe: 'Explicit text lowering at the boundary, usually by rendering one clipped frame.',
        accessible: 'Linear text output with explicit scroll status language when appropriate.',
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
        ),
      },
    ],
    source: {
      examplePath: 'examples/viewport/main.ts',
      snippetLabel: 'Masking viewport',
    },
    tags: ['layout', 'masking', 'scroll'],
  },
  {
    kind: 'component',
    id: 'kbd',
    coverageFamilyIds: ['inline-shortcut-cues'],
    family: 'Hints and shortcut cues',
    title: 'kbd()',
    package: 'bijou',
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
    source: {
      examplePath: 'examples/kbd/main.ts',
      snippetLabel: 'Inline shortcut cues',
    },
    tags: ['shortcuts', 'inline', 'hints'],
  },
] as const;

export function findComponentStory(id: string): ComponentStory | undefined {
  return COMPONENT_STORIES.find((story) => story.id === id);
}
