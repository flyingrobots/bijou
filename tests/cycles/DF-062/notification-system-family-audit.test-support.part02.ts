import { stringToSurface } from '@flyingrobots/bijou';
import { notify } from '../../../packages/bijou-tui/src/index.js';
import type { FramePage } from '../../../packages/bijou-tui/src/index.js';

import type { SaveModel, SaveMsg } from './notification-system-family-audit.test-support.part01.js';

function makeNotificationPage(): FramePage<SaveModel, SaveMsg> {
  return {
    id: 'home',
    title: 'Home',
    init: () => [{ saved: false }, []],
    update(msg, model) {
      if ('type' in msg && msg.type === 'save') {
        return [{
          ...model,
          saved: true,
        }, [notify<SaveMsg>({
          title: 'Saved draft',
          tone: 'SUCCESS',
          message: 'Frame-managed notification from the page update',
        })]];
      }
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId: 'main',
      render: (width, height) => stringToSurface('home', width, height),
    }),
  };
}

export { makeNotificationPage };
