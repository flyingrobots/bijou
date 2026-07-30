import { CANONICAL_STORY_PROFILE_PRESETS, boxSurface, column, line, progressBar, spacer, spinnerFrame } from './stories-runtime.js';
import { loopingProgressPercent } from './stories-helper-looping-progress-percent.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_PROGRESS_BAR: DogfoodComponentStory = {
    kind: 'component',
    id: 'progress-bar',
    coverageFamilyIds: ['progress-indicators'],
    family: 'Progress and loading',
    title: 'progressBar()',
    package: BIJOU_STORY_PACKAGE,
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
    tags: ['progress', 'loading', 'animation'],
  };
