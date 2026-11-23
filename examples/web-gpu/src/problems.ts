/** `CODE: message` for a typed error, the message otherwise. */
export function describeProblem(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return `${error.code}: ${error instanceof Error ? error.message : 'no message'}`;
  }
  return error instanceof Error ? error.message : String(error);
}

const nextFrame = (): Promise<void> => new Promise((resolve) => { requestAnimationFrame(() => { resolve(); }); });

/** Wait, a frame at a time, until `ready()` holds; give up after `frames`. */
export async function until(ready: () => boolean, frames = 120): Promise<void> {
  for (let frame = 0; frame < frames && !ready(); frame++) await nextFrame();
  if (!ready()) throw new Error('BIJOU_WEB_GPU_TIMEOUT: the condition did not hold');
}

