import type { ComponentEntry } from "./types.js";
import { FORMS_PART_01 } from "./registry-forms-part01.js";
import { FORMS_PART_02 } from "./registry-forms-part02.js";
import { FORMS_PART_03 } from "./registry-forms-part03.js";

export const FORMS: ComponentEntry[] = [
  ...FORMS_PART_01,
  ...FORMS_PART_02,
  ...FORMS_PART_03,
];
