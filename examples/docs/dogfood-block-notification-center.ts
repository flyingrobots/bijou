import { commandIntent, defineBlock, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import type { BlockDefinition, BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_MODES, DOGFOOD_BLOCK_PACKAGE, s } from './dogfood-block-common.js';

export interface NotificationCenterBlockConfig {
  readonly notificationCount?: number;
  readonly activeFilterLabel?: string;
}

export const notificationItemsRequirement = defineDataRequirement({
  id: 'notifications.items',
  resource: 'dogfood.notifications.items',
  label: 'Notification items',
  description: 'Frame-owned DOGFOOD notification rows.',
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
});

export const notificationFilterRequirement = defineDataRequirement({
  id: 'notifications.filter',
  resource: 'dogfood.notifications.filter',
  label: 'Notification filter',
  description: 'Current notification center filter state.',
  optional: true,
  facts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
});

export const notificationCenterData = defineViewData({
  id: 'notification-center.data',
  label: 'NotificationCenterBlock data',
  description: 'DOGFOOD notification items and filter posture.',
  requirements: [
    { name: 'items', requirement: notificationItemsRequirement },
    { name: 'filter', requirement: notificationFilterRequirement },
  ],
});

export const notificationDismissIntent = commandIntent<{ readonly notificationId: string }>(
  'notifications.dismiss',
  {
    label: 'Dismiss notification',
    description: 'Request dismissal of a DOGFOOD notification row.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NotificationCenterBlock' }],
  },
);

export const notificationSetFilterIntent = commandIntent<{ readonly filterId: string }>(
  'notifications.setFilter',
  {
    label: 'Set notification filter',
    description: 'Request a notification center filter change.',
    facts: [{ kind: 'entity', key: 'dogfood.command', value: 'NotificationCenterBlock' }],
  },
);

export const notificationCenterBlock: BlockDefinition<NotificationCenterBlockConfig, string> =
  defineBlock({
    metadata: {
      packageName: DOGFOOD_BLOCK_PACKAGE,
      blockName: 'NotificationCenterBlock',
      family: 'dogfood-notifications',
      scale: 'panel',
      modes: DOGFOOD_BLOCK_MODES,
      docs: {
        summary: 'Owns the frame notification center contract for inspectable DOGFOOD notices.',
        useWhen: ['DOGFOOD needs to expose notification center state and intents.'],
        avoidWhen: ['A page only emits a transient local message without frame ownership.'],
        relatedDocs: ['docs/DOGFOOD.md'],
      },
      sourcePath: 'packages/bijou-tui/src/app-frame.ts',
      slots: [
        { id: 'items', required: true, description: 'Notification rows.' },
        { id: 'filter', required: false, description: 'Current notification filter.' },
      ],
      variants: [
        {
          id: 'center',
          label: 'Center',
          requiredSlots: ['items'],
          optionalSlots: ['filter'],
          facts: [{ kind: 'state', key: 'dogfood.notifications.surface', value: 'center' }],
        },
      ],
      composedComponents: ['notificationCenterSurface()', 'toast()'],
      semanticFacts: [{ kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' }],
      storyIds: ['notification-center.center'],
      examples: [{ id: 'dogfood.notifications', label: 'DOGFOOD notification center' }],
      tags: ['dogfood', 'notifications', 'frame'],
    },
    data: notificationCenterData,
    commands: [
      notificationDismissIntent,
      notificationSetFilterIntent,
    ],
    render: renderNotificationCenterBlock,
  });

function renderNotificationCenterBlock(
  input: BlockRenderInput<NotificationCenterBlockConfig>,
): BlockRenderResult<string> {
  const notificationCount = input.config?.notificationCount ?? 0;
  const activeFilterLabel = input.config?.activeFilterLabel ?? 'All';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Notification items: ${s(notificationCount)}; filter: ${activeFilterLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' },
        { kind: 'state', key: 'dogfood.notifications.count', value: s(notificationCount) },
      ],
    };
  }

  return {
    output: [
      'NotificationCenterBlock',
      `items: ${s(notificationCount)}`,
      `filter: ${activeFilterLabel}`,
      'Intents: dismiss notification; set filter',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'NotificationCenterBlock' },
      { kind: 'state', key: 'dogfood.notifications.count', value: s(notificationCount) },
    ],
  };
}
