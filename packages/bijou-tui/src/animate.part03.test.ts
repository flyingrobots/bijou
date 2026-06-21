import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), 'animate.ts');

function docsForInternalCommand(source: string, functionName: string): string {
  const functionIndex = source.indexOf(`function ${functionName}`);
  if (functionIndex < 0) {
    return '';
  }
  const beforeFunction = source.slice(0, functionIndex);
  const docStart = beforeFunction.lastIndexOf('/**');
  if (docStart < 0) {
    return '';
  }
  return beforeFunction.slice(docStart);
}

describe('animation command docs', () => {
  it('documents pulse-driven spring and tween commands', () => {
    const source = readFileSync(sourcePath, 'utf8');
    const springDocs = docsForInternalCommand(source, 'createSpringCmd');
    const tweenDocs = docsForInternalCommand(source, 'createTweenCmd');
    expect(springDocs).toContain('runtime pulses');
    expect(springDocs).toContain('fixed-step');
    expect(springDocs).toContain('maxPulseSeconds');
    expect(tweenDocs).toContain('pulse');
    expect(tweenDocs).toContain('dt');
    for (const docs of [springDocs, tweenDocs]) {
      expect(docs).not.toContain('setInterval');
      expect(docs).not.toContain('Date.now');
      expect(docs).not.toContain('@param fps');
    }
  });
});
