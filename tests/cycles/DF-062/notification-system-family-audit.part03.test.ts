
import {
  _resetDefaultContextForTesting,
  afterEach,
  describe,
  expect,
  it,
  readRepoFile,
} from './notification-system-family-audit.test-support.js';

describe('DF-062 notification system family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps component-family guidance aligned with notification runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');
    expect(families).toContain('### Notification system');
    expect(families).toContain('- `renderNotificationStack()`');
    expect(families).toContain('- `renderNotificationHistory()`');
    expect(families).toContain('- `pushNotification()`');
    expect(families).toContain('- `dismissNotification()`');
    expect(families).toContain('- `tickNotifications()`');
    expect(families).toContain('- framed runtime notification routing');
    expect(families).toContain('- history/archive view');
    expect(families).toContain('- frame-routed runtime notifications');
    expect(families).toContain('stacking, placement, routing, or history matter');
    expect(families).toContain('pipe: lower to sequential event text or explicit warning/error records');
    expect(families).toContain('accessible: linearize current and archived notices');
  });
});
