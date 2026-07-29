import type { ComponentEntry } from "./types.js";
import { DATA_PART_01 } from "./registry-data-part01.js";
import { DATA_PART_02 } from "./registry-data-part02.js";
import { DATA_PART_03 } from "./registry-data-part03.js";

export const DATA: ComponentEntry[] = [
  ...DATA_PART_01,
  ...DATA_PART_02,
  ...DATA_PART_03,
];
