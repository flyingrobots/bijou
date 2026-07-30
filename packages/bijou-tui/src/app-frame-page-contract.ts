import type { BindingSource } from './help.js';
import type { KeyMap } from './keybindings.js';
import type { LayoutRect } from './layout-rect.js';
import type { MouseMsg } from './types.js';
import type { CommandPaletteItem } from './command-palette.js';
import type {
  FramePageMsg,
  FramePageText,
  FramePageUpdateResult,
} from './app-frame-types.js';
import type { FramePageLayerRegistry } from './app-frame-layers.js';
import type { FrameLayoutNode } from './app-frame-layout-contract.js';

/** Page declaration consumed by `createFramedApp`. */
export interface FramePage<PageModel, Msg> {
  /** Stable page id. */
  readonly id: string;
  /** Tab title. */
  readonly title: FramePageText<PageModel>;
  /** Page-level initializer. */
  init(): FramePageUpdateResult<PageModel, Msg>;
  /** Page-level updater (custom messages plus raw mouse forwarding). */
  update(
    msg: FramePageMsg<Msg>,
    model: PageModel,
  ): FramePageUpdateResult<PageModel, Msg>;
  /** Page layout tree. */
  layout(model: PageModel): FrameLayoutNode;
  /** Optional page keymap. */
  keyMap?: KeyMap<Msg>;
  /** Optional pane-scoped input layers owned by the focused pane. */
  inputAreas?: (
    model: PageModel,
  ) => readonly FrameInputArea<PageModel, Msg>[];
  /** Optional modal keymap. When present, it captures all keys until dismissed. */
  modalKeyMap?: (model: PageModel) => KeyMap<Msg> | undefined;
  /** Optional page-owned layer registry surfaced to the frame for workspace and page-modal control projection. */
  layers?: (model: PageModel) => FramePageLayerRegistry;
  /** Optional help source override. */
  helpSource?: BindingSource;
  /** Optional page-scoped command items for command palette listing/execution. */
  commandItems?: (model: PageModel) => readonly FrameCommandItem<Msg>[];
  /** Optional page-scoped search items opened by the shell search action. */
  searchItems?: (model: PageModel) => readonly FrameCommandItem<Msg>[];
  /** Optional title used by the shell search surface. */
  readonly searchTitle?: FramePageText<PageModel>;
}

/** Custom command-palette item with optional message dispatch action. */
export interface FrameCommandItem<Msg> extends CommandPaletteItem {
  /** Message dispatched when this item is selected. */
  readonly action?: Msg;
  /** Optional destination page for the dispatched message. Defaults to the active page. */
  readonly targetPageId?: string;
}

/** Declarative input ownership for a specific pane inside a frame page. */
export interface FrameInputArea<PageModel, Msg> {
  /** Target pane id. */
  readonly paneId: string;
  /** Optional pane-scoped key bindings. */
  readonly keyMap?: KeyMap<Msg>;
  /** Optional focused-pane help bindings. */
  readonly helpSource?: BindingSource;
  /** Optional pane-scoped mouse mapper. */
  readonly mouse?: (args: {
    readonly msg: MouseMsg;
    readonly model: PageModel;
    readonly rect: LayoutRect;
  }) => Msg | undefined;
}
