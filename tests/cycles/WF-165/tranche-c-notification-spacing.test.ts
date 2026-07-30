import { describe, expect, it } from 'vitest';
import {
  demoNotificationStackSpacing,
} from '../../../examples/notifications/notification-demo-options.js';

describe('WF-165 notification demo stack spacing', () => {
  it('uses one compact-aware contract for rendering and hit-testing', () => {
    expect(demoNotificationStackSpacing(40, 12)).toEqual({
      margin: 1,
      gap: 1,
    });
    expect(demoNotificationStackSpacing(80, 24)).toEqual({
      margin: 2,
      gap: 1,
    });
  });
});
