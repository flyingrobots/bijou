import { describe, it, expect } from 'vitest';
import { stepper } from './stepper.js';
import { createTestContext } from '../../adapters/test/index.js';

const steps = [
  { label: 'Account' },
  { label: 'Payment' },
  { label: 'Confirm' },
];

describe('stepper', () => {
  it('renders steps with markers in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = stepper(steps, { current: 1, ctx });
    expect(result).toContain('✓ Account');
    expect(result).toContain('● Payment');
    expect(result).toContain('○ Confirm');
    expect(result).toContain('──');
  });

  it('renders steps with markers in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = stepper(steps, { current: 0, ctx });
    expect(result).toContain('● Account');
    expect(result).toContain('○ Payment');
    expect(result).toContain('○ Confirm');
  });

  it('renders ASCII markers in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = stepper(steps, { current: 1, ctx });
    expect(result).toBe('[x] Account -- [*] Payment -- [ ] Confirm');
  });

  it('renders descriptive text in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = stepper(steps, { current: 1, ctx });
    expect(result).toBe('Step 2 of 3: Account (complete), Payment (current), Confirm (pending)');
  });

  it('handles first step as current', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = stepper(steps, { current: 0, ctx });
    expect(result).toBe('[*] Account -- [ ] Payment -- [ ] Confirm');
  });

  it('handles last step as current', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = stepper(steps, { current: 2, ctx });
    expect(result).toBe('[x] Account -- [x] Payment -- [*] Confirm');
  });

  it('handles single step', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = stepper([{ label: 'Done' }], { current: 0, ctx });
    expect(result).toContain('● Done');
    expect(result).not.toContain('──');
  });
});
