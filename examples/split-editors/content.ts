export const LEFT_CONTENT = `// app.ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, badge, alert } from '@flyingrobots/bijou';
import { run, quit } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  count: number;
  status: string;
}

type Msg =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'quit' };

const app = {
  init: () => [{ count: 0, status: 'ready' }, []],

  update: (msg, model) => {
    switch (msg.type) {
      case 'increment':
        return [{ ...model, count: model.count + 1 }, []];
      case 'decrement':
        return [{ ...model, count: model.count - 1 }, []];
      case 'reset':
        return [{ count: 0, status: 'reset' }, []];
      case 'quit':
        return [model, [quit()]];
    }
  },

  view: (model) => box(String(model.count)),
};

run(app);`;

export const RIGHT_CONTENT = `// app.test.ts
import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('counter app', () => {
  it('should initialize to zero', () => {
    const [model] = app.init();
    expect(model.count).toBe(0);
  });

  it('should increment', () => {
    const [model] = app.update(
      { type: 'increment' },
      { count: 5, status: 'ready' }
    );
    expect(model.count).toBe(6);
  });

  it('should decrement', () => {
    const [model] = app.update(
      { type: 'decrement' },
      { count: 3, status: 'ready' }
    );
    expect(model.count).toBe(2);
  });

  it('should reset to zero', () => {
    const [model] = app.update(
      { type: 'reset' },
      { count: 42, status: 'ready' }
    );
    expect(model.count).toBe(0);
    expect(model.status).toBe('reset');
  });

  it('should render in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const view = app.view({ count: 7, status: 'ready' });
    expect(view).toContain('7');
  });
});`;
