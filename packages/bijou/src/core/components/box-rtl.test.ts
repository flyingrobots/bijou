import { describe, it, expect } from 'vitest';
import { box, headerBox } from './box.js';
import { boxSurface } from './box-v3.part02.js';
import { createTestContext } from '../../adapters/test/index.js';
import { surfaceToString } from '../render/differ.js';
import { graphemeWidth } from '../text/grapheme.js';

const h = (n: number): string => '─'.repeat(n);
const top = (text: string): string => text.split('\n')[0] ?? '';
const surfaceTop = (text: string, options: Parameters<typeof boxSurface>[1]): string => {
  const style = options?.ctx?.style;
  if (style === undefined) throw new Error('surfaceTop needs options.ctx');
  return top(surfaceToString(boxSurface(text, options), style));
};

describe('box() title alignment by direction', () => {
  it('keeps the title at the left edge in ltr (default)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx }))).toBe(`┌─ Hi ${h(13)}┐`);
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx: createTestContext({ direction: 'ltr' }) }))).toBe(`┌─ Hi ${h(13)}┐`);
  });

  it('puts the title at the right edge when the context direction is rtl', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx }))).toBe(`┌${h(13)} Hi ─┐`);
  });

  it('lets an explicit direction option override the context in both directions', () => {
    const ltrCtx = createTestContext({ mode: 'interactive' });
    const rtlCtx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx: ltrCtx, direction: 'rtl' }))).toBe(`┌${h(13)} Hi ─┐`);
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx: rtlCtx, direction: 'ltr' }))).toBe(`┌─ Hi ${h(13)}┐`);
  });

  it('mirrors in static mode', () => {
    const ctx = createTestContext({ mode: 'static', direction: 'rtl' });
    expect(top(box('Hi', { title: 'Hi', width: 20, ctx }))).toBe(`┌${h(13)} Hi ─┐`);
  });

  it('leaves pipe and accessible output as plain logical content', () => {
    for (const mode of ['pipe', 'accessible'] as const) {
      const ctx = createTestContext({ mode, direction: 'rtl' });
      expect(box('Hello', { title: 'Hi', width: 20, ctx })).toBe('Hello');
    }
  });

  it('keeps every row the same display width for wide and combining titles', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    for (const title of ['日本語', 'e\u0301clair', '日本e\u0301']) {
      const lines = box('body', { title, width: 24, ctx }).split('\n');
      for (const line of lines) expect(graphemeWidth(line)).toBe(24);
      expect(lines[0]?.endsWith(` ${title} ─┐`)).toBe(true);
    }
  });

  it('mirrors a clipped title that leaves a gap and keeps the border width', () => {
    const ltrCtx = createTestContext({ mode: 'interactive' });
    const rtlCtx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    const ltr = top(box('x', { title: '日本語日本語', width: 12, ctx: ltrCtx }));
    const rtl = top(box('x', { title: '日本語日本語', width: 12, ctx: rtlCtx }));
    expect(ltr).toBe('┌─ 日本語──┐');
    expect(rtl).toBe('┌── 日本語─┐');
    expect(graphemeWidth(rtl)).toBe(12);
    expect(top(box('x', { title: 'Overlong title', width: 10, ctx: rtlCtx }))).toBe(
      top(box('x', { title: 'Overlong title', width: 10, ctx: ltrCtx })),
    );
  });

  it('mirrors an auto-width titled box and keeps the ltr output unchanged', () => {
    const ltr = top(box('a very long body line', { title: 'T', ctx: createTestContext({ mode: 'interactive' }) }));
    const rtl = top(box('a very long body line', { title: 'T', ctx: createTestContext({ mode: 'interactive', direction: 'rtl' }) }));
    expect(ltr).toBe(`┌─ T ${h(19)}┐`);
    expect(rtl).toBe(`┌${h(19)} T ─┐`);
  });

  it('mirrors the header box title through box()', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    expect(top(headerBox('Deploy', { title: 'Hi', width: 20, ctx }))).toBe(`┌${h(13)} Hi ─┐`);
  });
});

describe('boxSurface() title alignment by direction', () => {
  it('keeps the title at the left edge in ltr', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(surfaceTop('Hello', { title: 'Hi', width: 20, ctx })).toBe(`┌─ Hi ${h(13)}┐`);
  });

  it('puts the title at the right edge in rtl, from context or option', () => {
    const rtlCtx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    expect(surfaceTop('Hello', { title: 'Hi', width: 20, ctx: rtlCtx })).toBe(`┌${h(13)} Hi ─┐`);
    const ltrCtx = createTestContext({ mode: 'interactive' });
    expect(surfaceTop('Hello', { title: 'Hi', width: 20, ctx: ltrCtx, direction: 'rtl' })).toBe(`┌${h(13)} Hi ─┐`);
    expect(surfaceTop('Hello', { title: 'Hi', width: 20, ctx: rtlCtx, direction: 'ltr' })).toBe(`┌─ Hi ${h(13)}┐`);
  });

  it('mirrors combining titles and clips an overlong title', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    expect(surfaceTop('Hello', { title: 'e\u0301clair', width: 20, ctx })).toBe(`┌${h(9)} e\u0301clair ─┐`);
    expect(surfaceTop('x', { title: 'Overlong title', width: 10, ctx })).toBe('┌─ Overl─┐');
  });

  it('keeps the logical order in pipe and accessible modes', () => {
    for (const mode of ['pipe', 'accessible'] as const) {
      const ctx = createTestContext({ mode, direction: 'rtl' });
      expect(surfaceTop('Hello', { title: 'Hi', width: 20, ctx })).toBe(`┌─ Hi ${h(13)}┐`);
    }
  });
});
