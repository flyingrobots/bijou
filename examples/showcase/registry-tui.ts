import type { ComponentEntry } from "./types.js";
import { TUI_PART_01 } from "./registry-tui-part01.js";
import { TUI_PART_02 } from "./registry-tui-part02.js";
import { TUI_PART_03 } from "./registry-tui-part03.js";

export const TUI: ComponentEntry[] = [
  ...TUI_PART_01,
  ...TUI_PART_02,
  ...TUI_PART_03,
];
