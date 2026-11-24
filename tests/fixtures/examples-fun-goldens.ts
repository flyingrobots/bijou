// sha256 of the JSON of a frame's cells, per demo and pane size. Recorded from the
// seeded, pulse-driven sessions in tests/examples-fun-demos.test.ts: 30 pulses of 1/30 s,
// the demo's own key or pointer message, 30 more pulses, with seed 1888.
export const GOLDENS: Readonly<Record<string, string>> = {
  'metaballs 80x24 start': 'e4a22ff45df2bf35e2b0085df062537903f961ac58eb047a645730ceea23d312',
  'metaballs 80x24 frame 60': 'eb4ff4df5d283b4eca53918ab0e4ec2816505fd143f4d40fe18ec00e5ed31cef',
  'metaballs 177x53 start': 'fa4bed839449975949a45d13d65ba2db68572f6b5c7f1dea986705d5533e2f40',
  'metaballs 177x53 frame 60': '413a8bfc51cc196e26f70405b48c7c50c24ad821d89ede990a999f7b29e16075',
  'rainbow-gradient 80x24 start': 'f6bcac5d31102ad436294b1eb354b4fb0e25dc6a679a21e48075da768d8c8611',
  'rainbow-gradient 80x24 frame 60': 'fa7c04220a94c1a3c2fb171291afdf287c3aa72b3c4534d24b1bbd80383d2c65',
  'rainbow-gradient 177x53 start': '6ade8ce63cd37700497d4a64f04f0c93835405d2572c7e209a9b4d8ad37701a0',
  'rainbow-gradient 177x53 frame 60': '375cddd12ea344257b139a0ba86c1bdf57715b7b4278ca0a3e9d18e2e77f8a10',
  'wormhole 80x24 start': '77af7acc298d3874b5bc0c6cd221372bf8ec31807c53a2ab82bc918ab1631d21',
  'wormhole 80x24 frame 60': 'ae46944aad78ffea015c0e8fce0da2794f7c0ce9e7d167994792352fe1d29336',
  'wormhole 177x53 start': '4210b56d46083c4aca08195d56529c89c6b22a104c6cac00ab80258426f174b0',
  'wormhole 177x53 frame 60': '203cd2a7374eaadf560db969cf3bcaf1d138f1ece1e67353c50e9f079e888b71',
};
