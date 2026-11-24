// sha256 of the JSON of a frame's cells, per font demo and pane size. Recorded from the seeded sessions in
// tests/examples-fun-fonts.test.ts: 30 pulses of 1/30 s, `r` to clear the message, `i` and `Bijou` typed, `escape`,
// 30 more pulses, with seed 1888 and the Space Mono Bold Italic file of assets/fonts/space-mono.
export const FONT_GOLDENS: Readonly<Record<string, string>> = {
  'font-renderer 80x24 start': '58c2318238901d7bd3b9d91ade1e095959bc529883a393fbe60d8c8eb6aaf95d',
  'font-renderer 80x24 frame 60': 'ad47a053168388aa3ee2a7b824854867de3213ffebd53bd3f6bbf16c27bcb7b3',
  'font-renderer 177x53 start': 'c799cdb635af73bc904504f739ec0247d045e2cd6c1c9597a58dd84c3e90ebd5',
  'font-renderer 177x53 frame 60': 'f8f5327847628e82b9c6f0895877364be3b7a67ea1e2880f6ee7f5c860c63089',
  'text-cylinder 80x24 start': '2c8edb3dd2e6ef00d5ae27d104da9e42be1bd8e185a1fb5726da86ed23d2a193',
  'text-cylinder 80x24 frame 60': '163fa09def71b84c9babf78d97989187930b0cedf94d3e6574d869c745dc2ab8',
  'text-cylinder 177x53 start': '49ebb6f0594ccc7de5bcc7b7a48a300c1736dd03c21dc580b1a0e08858a5082f',
  'text-cylinder 177x53 frame 60': 'fb88d8a0b425f609d2225c4271769d60cee4e1179d84feb3a7f4b85a5e1e3c36',
};
