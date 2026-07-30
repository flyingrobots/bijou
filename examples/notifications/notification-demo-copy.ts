import type { NotificationTone } from '../../packages/bijou-tui/src/index.js';

export function toneCopy(tone: NotificationTone): {
  readonly title: string;
  readonly message: string;
} {
  switch (tone) {
    case 'INFO':
      return {
        title: 'Background sync ready',
        message: 'Fresh data is available for review.',
      };
    case 'SUCCESS':
      return {
        title: 'Release shipped cleanly',
        message: 'All checks passed and artifacts are live.',
      };
    case 'WARNING':
      return {
        title: 'Queue pressure rising',
        message: 'Latency is trending upward on the worker pool.',
      };
    case 'ERROR':
      return {
        title: 'Deploy blocked',
        message: 'The runtime failed to boot the latest candidate.',
      };
  }
}

export function actionLabelForTone(tone: NotificationTone): string {
  switch (tone) {
    case 'INFO':
      return 'Open details';
    case 'SUCCESS':
      return 'Share result';
    case 'WARNING':
      return 'Inspect queue';
    case 'ERROR':
      return 'Retry deploy';
  }
}

export function formatDurationLabel(value: number | null | undefined): string {
  if (value === undefined) return 'default';
  if (value === null) return 'persistent';
  return `${(value / 1000).toFixed(1)}s`;
}
