import type { KeyMsg, MouseMsg } from './types.js';
import { parseKey, parseMouse } from './keys.js';

const ESCAPE = String.fromCharCode(0x1b);
const SGR_MOUSE_PACKET_RE = new RegExp(`${ESCAPE}\\[<\\d+;\\d+;\\d+[Mm]`, 'gu');

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

    const keyMsg = parseKey(chunk);
    if (keyMsg.key !== 'unknown') messages.push(keyMsg);
  }
  return messages;
}
