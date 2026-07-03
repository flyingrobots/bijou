export type WorkerMouseTrackingMode = 'press' | 'drag' | 'any';

export const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

interface WorkerMouseModeOptions {
  readonly mouse?: boolean;
  readonly mouseMode?: WorkerMouseTrackingMode;
}

export function resolveWorkerMouseMode(
  options: WorkerMouseModeOptions,
): WorkerMouseTrackingMode | undefined {
  if (options.mouseMode !== undefined) return options.mouseMode;
  return options.mouse === true ? 'drag' : undefined;
}

export function mouseModeEnableSequence(mode: WorkerMouseTrackingMode): string {
  if (mode === 'press') return '\x1b[?1000h\x1b[?1002l\x1b[?1003l\x1b[?1006h';
  if (mode === 'any') return '\x1b[?1000h\x1b[?1002l\x1b[?1003h\x1b[?1006h';
  return '\x1b[?1000h\x1b[?1002h\x1b[?1003l\x1b[?1006h';
}
