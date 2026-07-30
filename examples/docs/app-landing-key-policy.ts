import type { KeyMsg } from '../../packages/bijou-tui/src/index.js';

export const shouldToggleLandingPerfHud = (message: KeyMsg): boolean =>
  !message.ctrl && !message.alt && message.key === '`';

export const shouldContinueFromLanding = (message: KeyMsg): boolean =>
  !message.ctrl &&
  !message.alt &&
  !message.shift &&
  message.key === 'enter';
