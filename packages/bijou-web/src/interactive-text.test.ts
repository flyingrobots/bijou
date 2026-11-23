import { describe, expect, it } from 'vitest';
import type { KeyInputMsg } from '@flyingrobots/bijou';
import { createWebInteractiveIO } from './index.js';
import type { WebTextEvent } from './web-dom.js';
import { createFakeTarget, withPrevent } from './interactive.test-support.js';

function setup() {
  const textarea = Object.assign(createFakeTarget<WebTextEvent>(), { value: '' });
  const rejected: string[] = [];
  const io = createWebInteractiveIO({ textarea, onPasteRejected: (text) => rejected.push(text) });
  const keys: KeyInputMsg[] = [];
  const raw: string[] = [];
  io.keyInput((key) => keys.push(key));
  io.rawInput((data) => raw.push(data));
  return {
    textarea, keys, raw, rejected,
    fire: (type: string, fields: object = {}) => textarea.dispatch(type, withPrevent(fields)),
  };
}

const text = (value: string): KeyInputMsg => ({ key: value, ctrl: false, alt: false, shift: false, text: value });

describe('createWebInteractiveIO() IME composition', () => {
  it.each(['é', '日本語', '😀'])('delivers committed %s once after a full composition', (committed) => {
    const { keys, raw, fire } = setup();
    fire('compositionstart');
    fire('compositionupdate', { data: 'n' });
    fire('compositionupdate', { data: committed.slice(0, 1) });
    expect(keys).toEqual([]);
    fire('compositionend', { data: committed });
    expect(keys).toEqual([text(committed)]);
    expect(raw).toEqual([committed]);
  });

  it('delivers once when compositionend arrives before input', () => {
    const { keys, textarea, fire } = setup();
    fire('compositionstart');
    fire('compositionend', { data: 'é' });
    textarea.value = 'é';
    fire('input', { data: 'é', inputType: 'insertCompositionText', isComposing: false });
    expect(keys).toEqual([text('é')]);
    expect(textarea.value).toBe('');
  });

  it('delivers once when input arrives before compositionend', () => {
    const { keys, fire } = setup();
    fire('compositionstart');
    fire('input', { data: 'é', inputType: 'insertCompositionText', isComposing: true });
    fire('input', { data: 'é', inputType: 'insertCompositionText', isComposing: false });
    expect(keys).toEqual([]);
    fire('compositionend', { data: 'é' });
    expect(keys).toEqual([text('é')]);
  });

  it('suppresses keydown while composing, by state and by isComposing', () => {
    const { keys, fire } = setup();
    fire('compositionstart');
    const during = fire('keydown', { key: 'a' });
    fire('compositionend', { data: 'あ' });
    const flagged = fire('keydown', { key: 'Enter', isComposing: true });
    expect(keys).toEqual([text('あ')]);
    expect(during.prevented()).toBe(false);
    expect(flagged.prevented()).toBe(false);
  });

  it('delivers nothing for a cancelled composition', () => {
    const { keys, fire } = setup();
    fire('compositionstart');
    fire('compositionupdate', { data: 'ni' });
    fire('compositionend', { data: '' });
    expect(keys).toEqual([]);
  });

  it('delivers a repeat of the same text typed after the composition settled', () => {
    const { keys, fire } = setup();
    fire('compositionstart');
    fire('compositionend', { data: 'é' });
    fire('input', { data: 'é', isComposing: false });
    fire('keydown', { key: 'Unidentified' });
    fire('input', { data: 'é', inputType: 'insertText', isComposing: false });
    expect(keys).toEqual([text('é'), text('é')]);
  });

  it('delivers input that has no composition, as on a mobile keyboard', () => {
    const { keys, textarea, fire } = setup();
    textarea.value = 'x';
    fire('input', { data: 'x', inputType: 'insertText', isComposing: false });
    expect(keys).toEqual([text('x')]);
    expect(textarea.value).toBe('');
  });

  it('delivers a mobile delete as the backspace key', () => {
    const { keys, fire } = setup();
    fire('input', { data: null, inputType: 'deleteContentBackward', isComposing: false });
    expect(keys).toEqual([{ key: 'backspace', ctrl: false, alt: false, shift: false }]);
  });
});

describe('createWebInteractiveIO() paste', () => {
  it('delivers single-line paste text and prevents the default insert', () => {
    const { keys, raw, fire } = setup();
    const event = fire('paste', { clipboardData: { getData: () => 'hello world' } });
    expect(keys).toEqual([text('hello world')]);
    expect(raw).toEqual(['hello world']);
    expect(event.prevented()).toBe(true);
  });

  it('asks the clipboard for plain text', () => {
    const { fire } = setup();
    const formats: string[] = [];
    fire('paste', { clipboardData: { getData: (format: string) => { formats.push(format); return 'x'; } } });
    expect(formats).toEqual(['text/plain']);
  });

  it.each(['hello\n', 'hello\r\n', 'hello\r'])('trims one trailing line break from %j', (pasted) => {
    const { keys, fire } = setup();
    fire('paste', { clipboardData: { getData: () => pasted } });
    expect(keys).toEqual([text('hello')]);
  });

  it.each(['a\nb', 'a\r\nb', 'a\rb', '\nabc'])('rejects multi-line paste %j without an Enter key', (pasted) => {
    const { keys, raw, rejected, fire } = setup();
    const event = fire('paste', { clipboardData: { getData: () => pasted } });
    expect(keys).toEqual([]);
    expect(raw).toEqual([]);
    expect(rejected).toEqual([pasted]);
    expect(event.prevented()).toBe(true);
  });

  it.each([null, undefined])('delivers nothing when clipboardData is %s', (clipboardData) => {
    const { keys, fire } = setup();
    fire('paste', { clipboardData });
    expect(keys).toEqual([]);
  });

  it('delivers nothing for a paste of only a line break', () => {
    const { keys, rejected, fire } = setup();
    fire('paste', { clipboardData: { getData: () => '\n' } });
    expect(keys).toEqual([]);
    expect(rejected).toEqual([]);
  });

  it('strips control characters so paste cannot forge escape sequences', () => {
    const { keys, raw, fire } = setup();
    fire('paste', { clipboardData: { getData: () => 'a\x1b[Ab\x9b\x7f\tc' } });
    expect(keys).toEqual([text('a[Abc')]);
    expect(raw).toEqual(['a[Abc']);
  });
});
