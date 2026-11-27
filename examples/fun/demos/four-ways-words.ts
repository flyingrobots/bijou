// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The `pipe` and `accessible` lowerings of the comet: structured log lines for a machine,
// and plain sentences a screen reader can speak, written only when something happens.
import { distance, elements, inbound, nearest, speedKms, type Comet, type SkyEvent } from './four-ways-sim.js';

const fixed = (n: number, digits: number): string => n.toFixed(digits);
const au = (n: number): string => `${fixed(n, 2)}AU`;
const kms = (n: number): string => `${fixed(n, 1)}km/s`;
const spokenAu = (n: number): string => `${fixed(n, 1)} astronomical units`;
const spokenKms = (comet: Comet): string => `${String(Math.round(speedKms(comet)))} kilometres a second`;
const title = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

/** The periodic machine line: the whole state in key=value fields. */
export function sampleLine(comet: Comet, t: number): string {
  const near = nearest(comet, t);
  const { phase } = elements(comet);
  return `t=${fixed(t, 2)} comet r=${au(distance(comet))} v=${kms(speedKms(comet))} nearest=${near.planet.name} d=${au(near.gap)} phase=${fixed(phase, 3)}`;
}

/** An event as a machine line. */
export function eventLine(event: SkyEvent): string {
  const head = `t=${fixed(event.t, 2)} event=${event.kind}`;
  const tail = `r=${au(distance(event.comet))} v=${kms(speedKms(event.comet))}`;
  return 'planet' in event ? `${head} body=${event.planet.name} ${tail}` : `${head} ${tail}`;
}

/** An event as a sentence. */
export function eventSentence(event: SkyEvent): string {
  const { comet } = event;
  const r = distance(comet);
  switch (event.kind) {
    case 'perihelion':
      return `Perihelion. The comet whips round the sun ${spokenAu(r)} out, at its fastest: ${spokenKms(comet)}.`;
    case 'aphelion':
      return `Aphelion. The comet hangs ${spokenAu(r)} from the sun, crawling at ${spokenKms(comet)}, and begins to fall back.`;
    case 'crossing':
      return inbound(comet)
        ? `The comet crosses the orbit of ${title(event.planet.name)}, falling inward at ${spokenKms(comet)}.`
        : `The comet crosses the orbit of ${title(event.planet.name)}, climbing outward at ${spokenKms(comet)}.`;
    case 'approach':
      return inbound(comet)
        ? `The comet is swinging past ${event.planet.called}, speeding up to ${spokenKms(comet)}.`
        : `The comet is swinging past ${event.planet.called}, slowing to ${spokenKms(comet)}.`;
  }
}

/** The machine line and sentence for a new comet. */
export function arrival(comet: Comet, t: number): readonly [string, string] {
  const { a, e } = elements(comet);
  const heading = inbound(comet) ? 'falling toward the sun' : 'climbing away from the sun';
  return [
    `t=${fixed(t, 2)} event=new a=${au(a)} e=${fixed(e, 3)} r=${au(distance(comet))}`,
    `A new comet appears ${spokenAu(distance(comet))} out, ${heading} at ${spokenKms(comet)}.`,
  ];
}

/** Word-wrap a sentence to `width` columns. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width) line = `${line} ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}
