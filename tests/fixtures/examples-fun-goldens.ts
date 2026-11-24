// sha256 of the JSON of a frame's cells, per demo and pane size. Recorded from the
// seeded, pulse-driven sessions in tests/examples-fun-demos.test.ts: 30 pulses of 1/30 s,
// the demo's own key or pointer message, 30 more pulses, with seed 1888.
export const GOLDENS: Readonly<Record<string, string>> = {
  'metaballs 80x24 start': '62db70f207e862fa71238859bbc5122c1eb0f59b5c2595ea700c89b4ff7a6b0f',
  'metaballs 80x24 frame 60': 'cb87ea204fa6ab8061bd78fe64ceee6e21f7145ef28d9ff1db217976c9fee8ad',
  'metaballs 177x53 start': '4c1001786d9333826edc8d77b5d8d88d01209f70c2a53c598b0420a08d064e97',
  'metaballs 177x53 frame 60': 'd7e42697ca6ca9ff2a756e609611a464e366ab79a9a58cdb66d0ac50884df06f',
  'rainbow-gradient 80x24 start': '08ba9ee8d57619631663021b879514edbdacc0abf25ae8bda237c619ea7f1edb',
  'rainbow-gradient 80x24 frame 60': '8db52ac6ee0f5ba9279949ced76570e985e33c5fa4bc47aa3bcd2fd861113773',
  'rainbow-gradient 177x53 start': '847fe9661449c3397d705cdb62ca4e4f76c0f83cbb74721b3839a91fb3f2137d',
  'rainbow-gradient 177x53 frame 60': '817808b90f8c3e3ff0637d5393b44d7b1780ebcafa22918861758c18d05f0b2c',
  'wormhole 80x24 start': 'cd200ad7b4fd3ca4d624b228a6bbe80d59ed88cbe89561c1945eefaefc6a218e',
  'wormhole 80x24 frame 60': 'bc2d1ac9506e16d3fdef5286a66c149efe8e58ac43851bf6afc15f0e63423235',
  'wormhole 177x53 start': '8bc2a63a7f10cdde5b5fa7a28ed282265274aa7b7c83c08c894d2a475f40f997',
  'wormhole 177x53 frame 60': '9c84fbd3e2c5f26175000d0ca09d71fe1f92f34f17bfc136d3ad70e7efc24098',
};
