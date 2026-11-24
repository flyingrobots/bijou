// sha256 of the JSON of a frame's cells, per font demo and pane size. Recorded from the seeded sessions in
// tests/examples-fun-fonts.test.ts: 30 pulses of 1/30 s, `r` to clear the message, `i` and `Bijou` typed, `escape`,
// 30 more pulses, with seed 1888 and the Space Mono Bold Italic file of assets/fonts/space-mono.
export const FONT_GOLDENS: Readonly<Record<string, string>> = {
  'font-renderer 80x24 start': 'pending',
  'font-renderer 80x24 frame 60': 'pending',
  'font-renderer 177x53 start': 'pending',
  'font-renderer 177x53 frame 60': 'pending',
  'text-cylinder 80x24 start': 'pending',
  'text-cylinder 80x24 frame 60': 'pending',
  'text-cylinder 177x53 start': 'pending',
  'text-cylinder 177x53 frame 60': 'pending',
};
