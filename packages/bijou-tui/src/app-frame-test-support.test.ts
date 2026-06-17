import { describe, expect, it } from 'vitest';
import {
  collectCommandMessages,
  type Cmd,
} from './app-frame.test-support.js';

describe('app-frame test support', () => {
  it('fails fast when command collection exhausts its pulse budget', async () => {
    const resolvers: (() => void)[] = [];
    const pendingCmd: Cmd<string> = () => new Promise<void>((resolve) => {
      resolvers.push(resolve);
    });

    await expect(Promise.race([
      collectCommandMessages(pendingCmd, [0.1]),
      new Promise<'timed out'>((resolve) => {
        setTimeout(() => {
          resolve('timed out');
        }, 0);
      }),
    ])).rejects.toThrow('stuck after 1 pulse');
    expect(resolvers).toHaveLength(1);
  });
});
