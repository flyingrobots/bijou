import { createHash } from 'node:crypto';
import type { DemoMsg } from '../../examples/fun/contract.js';

const key = (name: string): DemoMsg => ({ type: 'key', key: name });
/** The pulse step the fixtures use, 1/30 s. The fluid demos ignore it and step by their own fixed amount. */
export const pulse: DemoMsg = { type: 'pulse', dt: 1 / 30 };

/** The two fluid demos' own input: pour with a key a pulse, then shake up, then let it settle. */
export function fluidScript(id: string, size?: { readonly width: number; readonly height: number }): DemoMsg[] | undefined {
  if (id !== 'fluid' && id !== 'flip-fluid') return undefined;
  const sized: DemoMsg[] = size === undefined ? [] : [{ type: 'resize', ...size }];
  const pours = Array.from({ length: 30 }, () => [key('p'), pulse]).flat();
  return [...sized, ...pours, key('x'), ...Array.from({ length: 30 }, () => pulse)];
}

/** Every key the fluid demos answer to, plus keys that mean nothing to them. */
export const FLUID_KEYS: readonly string[] = ['p', 'r', 't', 'h', 'z', 'x', 'c', 'w', 'a', 's', 'd', 'up', 'down', 'q'];

/** `steps` pulses with keys drawn between them from a seeded `random`: never the clock, never Math.random. */
export function seededInputs(random: () => number, steps: number): DemoMsg[] {
  return Array.from({ length: steps }, () => {
    const roll = random();
    const name = FLUID_KEYS[Math.floor(random() * FLUID_KEYS.length)] ?? 'p';
    const keys = roll < 0.03 ? [key('p')] : roll < 0.2 ? [key(name)] : [];
    return [...keys, pulse];
  }).flat();
}

/** sha256 of the numbers in each list, in order: a state's fingerprint. */
export function numbersHash(lists: readonly ArrayLike<number>[]): string {
  const hash = createHash('sha256');
  for (const list of lists) hash.update(JSON.stringify(Array.from(list)));
  return hash.digest('hex');
}
