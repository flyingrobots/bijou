import type { KeyMsg, MouseMsg } from './types.js';
import { parseKey, parseMouse } from './keys.js';

const ESCAPE = String.fromCharCode(0x1b);
const ESCAPE_CODE = 0x1b;
const X10_MOUSE_PACKET_LENGTH = 6;
const X10_MOUSE_PREFIX = `${ESCAPE}[M`;
const SGR_MOUSE_PACKET_RE = new RegExp(`${ESCAPE}\\[<\\d+;\\d+;\\d+[Mm]`, 'gu');

interface KeyToken {
  readonly message: KeyMsg | null;
  readonly nextIndex: number;
}

function splitSgrMousePackets(raw: string): readonly string[] {
  const chunks: string[] = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(SGR_MOUSE_PACKET_RE)) {
    if (match.index > lastIndex) {
      chunks.push(raw.slice(lastIndex, match.index));
    }
    chunks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) chunks.push(raw.slice(lastIndex));
  return chunks.length === 0 ? [raw] : chunks;
}

function parseKeyMessages(raw: string): readonly KeyMsg[] {
  const messages: KeyMsg[] = [];
  let index = 0;
  while (index < raw.length) {
    const token = raw.charCodeAt(index) === ESCAPE_CODE
      ? readEscapeKeyToken(raw, index)
      : readSingleKeyToken(raw, index);
    if (token.message !== null) messages.push(token.message);
    index = token.nextIndex;
  }
  return messages;
}

function readSingleKeyToken(raw: string, index: number): KeyToken {
  const message = parseKey(raw.slice(index, index + 1));
  return {
    message: message.key === 'unknown' ? null : message,
    nextIndex: index + 1,
  };
}

function readEscapeKeyToken(raw: string, index: number): KeyToken {
  const sequenceEnd = findEscapeSequenceEnd(raw, index);
  let message: KeyMsg | null = null;
  let nextIndex = index + 1;
  for (let end = index + 1; end <= sequenceEnd; end += 1) {
    const parsed = parseKey(raw.slice(index, end));
    if (parsed.key !== 'unknown') {
      message = parsed;
      nextIndex = end;
    }
  }

  if (message !== null && (nextIndex > index + 1 || !isControlSequence(raw, index))) {
    return { message, nextIndex };
  }
  return { message: null, nextIndex: sequenceEnd };
}

function findEscapeSequenceEnd(raw: string, index: number): number {
  if (raw.startsWith(X10_MOUSE_PREFIX, index)) {
    return Math.min(index + X10_MOUSE_PACKET_LENGTH, raw.length);
  }
  if (raw[index + 1] === '[') {
    for (let end = index + 2; end < raw.length; end += 1) {
      if (isCsiFinalByte(raw.charCodeAt(end))) return end + 1;
    }
    return raw.length;
  }
  if (raw[index + 1] === 'O') return Math.min(index + 3, raw.length);
  return index + 1;
}

function isControlSequence(raw: string, index: number): boolean {
  return raw[index + 1] === '[' || raw[index + 1] === 'O';
}

function isCsiFinalByte(code: number): boolean {
  return code >= 0x40 && code <= 0x7e;
}

export function parseRawInputMessages(
  raw: string,
  mouseEnabled: boolean,
): readonly (KeyMsg | MouseMsg)[] {
  const messages: (KeyMsg | MouseMsg)[] = [];
  const chunks = mouseEnabled ? splitSgrMousePackets(raw) : [raw];
  for (const chunk of chunks) {
    if (chunk.length === 0) continue;
    if (mouseEnabled) {
      const mouseMsg = parseMouse(chunk);
      if (mouseMsg !== null) {
        messages.push(mouseMsg);
        continue;
      }
    }

    messages.push(...parseKeyMessages(chunk));
  }
  return messages;
}
