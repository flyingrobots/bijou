import type { ComponentEntry } from "./types.js";
import { DISPLAY_PART_01 } from "./registry-display-part01.js";
import { DISPLAY_PART_02 } from "./registry-display-part02.js";
import { DISPLAY_PART_03 } from "./registry-display-part03.js";

export const DISPLAY: ComponentEntry[] = [
  ...DISPLAY_PART_01,
  ...DISPLAY_PART_02,
  ...DISPLAY_PART_03,
];
