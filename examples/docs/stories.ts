import type { BijouContext } from '@flyingrobots/bijou';
import {
  alert,
  box,
  boxSurface,
  headerBox,
  hyperlink,
  inspector,
  kbd,
  log,
  markdown,
  progressBar,
  separatorSurface,
  skeleton,
  spinnerFrame,
  type Surface,
} from '@flyingrobots/bijou';
import {
  compositeSurface,
  modal,
  toast,
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

function toastBackdrop(width: number, height: number, ctx: BijouContext): Surface {
  const panel = boxSurface(column([
    row(['release queue  ', badgeSurface('LIVE', 'success', ctx)]),
    spacer(),
    line('Canaries stable in eu-west'),
    line('Promotion window opens in 4m'),
  ]), {
    title: 'release dashboard',
    width: Math.max(28, width - 4),
    ctx,
  });
  return screenSurface(width, height, panel, 1, 1);
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

const MARKDOWN_RELEASE_NOTES = [
  '# Release note',
  '',
  '**Bijou** keeps docs, shell, and examples inside the same runtime.',
  '',
  '## This slice',
  '',
  '- documents bounded prose honestly',
  '- keeps links explicit instead of vague',
  '- avoids turning markdown into layout chrome',
  '',
  '> Move to pager patterns if the content becomes a document-reading task.',
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
    id: 'toast',
    coverageFamilyIds: ['low-level-transient-overlay'],
    family: 'Feedback overlays and history',
    title: 'toast()',
    package: 'bijou-tui',
    docs: {
      summary: 'Low-level transient overlay primitive for one directly composed, anchored notification when the full notification system would be too heavy.',
      useWhen: [
        'You are composing one transient overlay directly inside a local surface.',
        'Explicit corner anchoring matters.',
        'The app does not need stacking, routing, actions, or history for this message.',
      ],
      avoidWhen: [
        'The app needs stacking, routing, actions, or recall; prefer the notification system.',
        'The message should stay in page flow; prefer `alert()` or `note()`.',
        'The surface needs supplemental work or a blocking decision; prefer `drawer()` or `modal()`.',
      ],
      relatedFamilies: ['alert()', 'notification system', 'modal()'],
      gracefulLowering: {
        interactive: 'Anchored transient overlay with explicit variant and placement over the current surface.',
        static: 'Single deterministic overlay frame preserving the same variant and placement.',
        pipe: 'Plain one-off event line or app-owned status output instead of a floating overlay.',
        accessible: 'Explicit announcement text describing the transient event without relying on spatial position.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'saved-top-right',
        label: 'Saved notification',
        description: 'A directly composed success toast anchored to the current working surface.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Operation saved.',
            variant: 'success',
            anchor: 'top-right',
            screenWidth,
            screenHeight,
            ctx,
          });
          if (ctx.mode === 'interactive' || ctx.mode === 'static') {
            return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
          }
          return overlay.content;
        },
      },
      {
        id: 'error-bottom-left',
        label: 'Anchored error',
        description: 'Low-level toast placement remains explicit when one local failure needs brief attention.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Rollback required before promote.',
            variant: 'error',
            anchor: 'bottom-left',
            screenWidth,
            screenHeight,
            ctx,
          });
          if (ctx.mode === 'interactive' || ctx.mode === 'static') {
            return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
          }
          return overlay.content;
        },
      },
    ],
    source: {
      examplePath: 'examples/toast/main.ts',
      snippetLabel: 'Anchored transient overlay',
    },
    tags: ['feedback', 'overlay', 'transient'],
  },
  {
    kind: 'component',
    id: 'log',
    coverageFamilyIds: ['activity-stream'],
    family: 'Feedback overlays and history',
    title: 'log()',
    package: 'bijou',
    docs: {
      summary: 'Chronological activity-stream primitive for accumulating operational events with explicit severity and optional timestamps.',
      useWhen: [
        'Order and accumulation matter more than interruption.',
        'The user benefits from scanning a timeline of events instead of only the latest status.',
        'The output should remain honest in pipe and accessible modes as plain chronological text.',
      ],
      avoidWhen: [
        'The message should interrupt or demand immediate attention; prefer `alert()` or `toast()`.',
        'A single inline label or current status is enough.',
        'The user needs a summary panel instead of raw chronological events.',
      ],
      relatedFamilies: ['notification system', 'alert()', 'badge()'],
      gracefulLowering: {
        interactive: 'Chronological lines with level cues and optional timestamps remain scannable in place.',
        static: 'Single deterministic activity transcript preserving order and severity cues.',
        pipe: 'Plain sequential output is already a natural fit.',
        accessible: 'Timestamps and levels stay explicit in linear text without decorative formatting.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-events',
        label: 'Release events',
        description: 'Chronological accumulation of mixed-severity deployment events.',
        render: ({ ctx }) => box([
          log('debug', 'Connecting to release queue...', { ctx }),
          log('info', 'Canary started in eu-west', { ctx }),
          log('warn', '2 workers still draining old jobs', { ctx }),
          log('error', 'One verification probe timed out', { ctx }),
        ].join('\n'), {
          title: 'activity stream',
          width: 54,
          ctx,
        }),
      },
      {
        id: 'timed-audit',
        label: 'Timed audit',
        description: 'Optional timestamps help when the event order itself needs auditing.',
        render: ({ ctx }) => box([
          log('info', 'Rollout window opened', { timestamp: true, ctx }),
          log('info', 'Canaries reached 25%', { timestamp: true, ctx }),
          log('warn', 'Waiting on staging approval', { timestamp: true, ctx }),
        ].join('\n'), {
          title: 'release audit',
          width: 54,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/log/main.ts',
      snippetLabel: 'Chronological event stream',
    },
    tags: ['feedback', 'history', 'events'],
  },
  {
    kind: 'component',
    id: 'markdown',
    coverageFamilyIds: ['formatted-documents-and-prose'],
    family: 'Documents and references',
    title: 'markdown()',
    package: 'bijou',
    docs: {
      summary: 'Bounded structured prose renderer for help, release notes, and reference text that should stay honest across rich, pipe, and accessible modes.',
      useWhen: [
        'Help, reference, or release-note prose needs lightweight structure without becoming a whole document reader.',
        'The same content should remain understandable in interactive, static, pipe, and accessible modes.',
        'Headings, lists, links, or short quotes materially improve scannability.',
      ],
      avoidWhen: [
        'The app is really composing interface chrome, forms, or layout rather than prose.',
        'The content needs deep navigation instead of one bounded rendered block.',
        'Browser-grade markdown fidelity or arbitrary user-authored documents are expected.',
      ],
      relatedFamilies: ['hyperlink()', 'box()', 'pager()'],
      gracefulLowering: {
        interactive: 'Bounded structured prose keeps headings, emphasis, lists, and links readable within terminal constraints.',
        static: 'Single deterministic document block preserves the same structure without live interaction.',
        pipe: 'Plain text keeps heading/list/code semantics understandable without styling.',
        accessible: 'Headings, lists, links, and code cues stay explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-note',
        label: 'Release note',
        description: 'A bounded markdown document that behaves like reference prose instead of layout chrome.',
        render: ({ ctx }) => box(markdown(MARKDOWN_RELEASE_NOTES, { width: 42, ctx }), {
          title: 'release note',
          width: 50,
          ctx,
        }),
      },
      {
        id: 'help-excerpt',
        label: 'Help excerpt',
        description: 'Short structured help text stays scannable without becoming a full document browser.',
        render: ({ ctx }) => box(markdown([
          '## Quick start',
          '',
          '1. Open the command palette.',
          '2. Search for a component family.',
          '3. Read the usage notes before choosing a surface.',
          '',
          'Use [`hyperlink()`](https://github.com/flyingrobots/bijou) when the destination itself matters.',
        ].join('\n'), { width: 42, ctx }), {
          title: 'help excerpt',
          width: 50,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/markdown/main.ts',
      snippetLabel: 'Bounded markdown prose',
    },
    tags: ['docs', 'prose', 'reference'],
  },
  {
    kind: 'component',
    id: 'hyperlink',
    coverageFamilyIds: ['linked-destinations'],
    family: 'Documents and references',
    title: 'hyperlink()',
    package: 'bijou',
    docs: {
      summary: 'Explicit destination primitive for links that should remain meaningful whether or not the terminal supports clickable OSC 8 output.',
      useWhen: [
        'The destination matters and should remain part of the rendered output.',
        'Supporting terminals should get clickability without hiding the destination semantics.',
        'Fallback behavior needs to stay intentional in pipe or accessible modes.',
      ],
      avoidWhen: [
        'The destination is ambiguous or should not be activated casually.',
        'The label is generic and hides the real meaning or trust context.',
        'The user needs an app-owned action rather than an external destination.',
      ],
      relatedFamilies: ['markdown()', 'note()', 'helpView()'],
      gracefulLowering: {
        interactive: 'Meaningful visible link text remains present while supporting terminals get OSC 8 clickability.',
        static: 'Deterministic link text still preserves the same explicit destination semantics.',
        pipe: 'Fallback modes keep the destination or label explicit in plain text.',
        accessible: 'Label and destination remain clear in reading order without assuming clickability.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'explicit-destinations',
        label: 'Explicit destinations',
        description: 'Link labels describe the destination instead of hiding it behind generic action copy.',
        render: ({ ctx }) => box([
          `Repository: ${hyperlink('flyingrobots/bijou', 'https://github.com/flyingrobots/bijou', { ctx })}`,
          '',
          `API docs: ${hyperlink('README reference', 'https://github.com/flyingrobots/bijou#readme', { ctx })}`,
        ].join('\n'), {
          title: 'linked destinations',
          width: 58,
          ctx,
        }),
      },
      {
        id: 'fallback-modes',
        label: 'Fallback modes',
        description: 'Fallback formatting remains an explicit product choice when clickable links are unavailable.',
        render: ({ ctx }) => box([
          `Both: ${hyperlink('Release notes', 'https://example.com/release-notes', { fallback: 'both', ctx })}`,
          '',
          `URL only: ${hyperlink('API reference', 'https://example.com/api', { fallback: 'url', ctx })}`,
          '',
          `Text only: ${hyperlink('Trusted local handbook', 'https://example.com/handbook', { fallback: 'text', ctx })}`,
        ].join('\n'), {
          title: 'fallback policy',
          width: 62,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/hyperlink/main.ts',
      snippetLabel: 'Explicit link destinations',
    },
    tags: ['docs', 'links', 'destinations'],
  },
  {
    kind: 'component',
    id: 'box',
    coverageFamilyIds: ['framed-grouping'],
    family: 'Structural grouping and inspection',
    title: 'box()',
    package: 'bijou',
    docs: {
      summary: 'Canonical containment primitive for grouped content and compact titled panels, with `headerBox()` and surface companions for richer layout composition.',
      useWhen: [
        'A region needs visible containment so sibling working areas read as distinct jobs.',
        'A compact titled panel needs terse supporting detail such as scope, version, or environment.',
        'Grouping helps comprehension more honestly than another heading or paragraph break alone.',
      ],
      avoidWhen: [
        'The border would only add decoration and not communicate real containment.',
        'Urgency or interruption is the primary job; prefer `alert()` or `modal()`.',
        'Whitespace, a separator, or a simple heading would already explain the structure clearly.',
      ],
      relatedFamilies: ['separator()', 'alert()', 'inspector()'],
      gracefulLowering: {
        interactive: 'Bordered or titled containment stays visible so grouped regions remain distinct working areas.',
        static: 'Single deterministic grouped panels preserve the same containment and title/detail cues.',
        pipe: 'Plain grouped text with spacing and optional titles instead of decorative borders.',
        accessible: 'Preserve title and content order without depending on borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'header-detail',
        label: 'Header detail',
        description: 'Compact titled grouping with terse metadata instead of a full explanatory sentence.',
        render: ({ ctx }) => [
          headerBox('Deploy', { detail: 'v4.0.0 → production', ctx }),
          '',
          box('Window\n\n- freeze at 17:00\n- canaries at 17:15\n- promote after verification', {
            title: 'release window',
            width: 38,
            ctx,
          }),
        ].join('\n'),
      },
      {
        id: 'peer-panels',
        label: 'Peer panels',
        description: 'Contained sibling regions that read as separate work areas instead of one blended block.',
        render: ({ ctx }) => row([
          boxSurface('Signals\n\n- latency\n- throughput\n- queue depth', {
            title: 'ops',
            width: 20,
            ctx,
          }),
          spacer(2),
          boxSurface('Actions\n\n- confirm deploy\n- watch canaries\n- page owner', {
            title: 'release',
            width: 22,
            ctx,
          }),
        ]),
      },
    ],
    source: {
      examplePath: 'examples/box/main.ts',
      snippetLabel: 'Grouped containment',
    },
    tags: ['structure', 'grouping', 'panels'],
  },
  {
    kind: 'component',
    id: 'inspector',
    coverageFamilyIds: ['inspector-panels'],
    family: 'Structural grouping and inspection',
    title: 'inspector()',
    package: 'bijou',
    docs: {
      summary: 'Canonical side-panel summary surface for the currently selected thing, keeping one obvious active value and calmer supporting sections nearby.',
      useWhen: [
        'A side panel needs to summarize the currently selected object without taking over the main task.',
        'One obvious active value should stay more prominent than the supporting details beneath it.',
        'Supporting context benefits from compact titled sections instead of freeform prose.',
      ],
      avoidWhen: [
        'The content is a guided recommendation with evidence and next-action structure; prefer `explainability()`.',
        'The content is only a one-line status or note.',
        'The panel needs its own deep navigation or multistep interaction model.',
      ],
      relatedFamilies: ['box()', 'explainability()', 'preferenceListSurface()'],
      gracefulLowering: {
        interactive: 'Titled containment, current-selection emphasis, and compact section rhythm stay visible in one calm panel.',
        static: 'Single deterministic panel preserves the same hierarchy without motion.',
        pipe: 'Explicit field labels keep the current selection obvious in plain grouped text.',
        accessible: 'Linearized plain-language fields preserve the same meaning without borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'package-summary',
        label: 'Package summary',
        description: 'A current selection with concise supporting sections that stay calmer than the main value.',
        render: ({ ctx }) => inspector({
          title: 'package summary',
          currentValue: 'release-control',
          supportingText: 'Currently selected package in the registry overview.',
          sections: [
            { title: 'Owner', content: 'Platform' },
            { title: 'Profile', content: 'Rich' },
            {
              title: 'Description',
              content: 'Coordinates the release queue, rollout window, and production promotion handoff.',
              tone: 'muted',
            },
          ],
          width: 40,
          ctx,
        }),
      },
      {
        id: 'rollout-review',
        label: 'Rollout review',
        description: 'Inspector rhythm stays useful for operational review without turning into a second page.',
        render: ({ ctx }) => inspector({
          title: 'active rollout',
          currentValue: 'canary-eu-west',
          supportingText: 'Watching the currently selected rollout slice before promotion.',
          sections: [
            { title: 'Health', content: 'Stable • 0 failed checks' },
            { title: 'ETA', content: '8 minutes remaining' },
            {
              title: 'Description',
              content: 'Use the inspector for concise sidecar context, not a full operational dashboard.',
              tone: 'muted',
            },
          ],
          width: 42,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/app-frame/main.ts',
      snippetLabel: 'Inspector side panel',
    },
    tags: ['structure', 'inspection', 'side-panel'],
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
