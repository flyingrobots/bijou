import type { BijouContext } from '@flyingrobots/bijou';
import { initDefaultContext, scopedNodeIO } from '@flyingrobots/bijou-node';
import type {
  ImageViewerApp,
  ImageViewerOptions,
} from './image-viewer-contract.js';
import {
  createImagePickerState,
  resolveStartupPaths,
} from './image-viewer-files.js';
import {
  DEFAULT_IMAGE_TUNING,
  DEFAULT_IMAGE_VIEWPORT,
  pickerHeight,
} from './image-viewer-options.js';
import { firstImagePath, focusSelectedEntry } from './image-viewer-picker.js';
import { renderImageViewer } from './image-viewer-render.js';
import { updateImageViewer } from './image-viewer-update.js';

export function createImageViewerApp(
  ctx: BijouContext = initDefaultContext(),
  options: ImageViewerOptions = {},
): ImageViewerApp {
  const startup = resolveStartupPaths(options);
  const io = scopedNodeIO({ root: startup.root });

  return {
    init: () => {
      const columns = Math.max(1, options.columns ?? ctx.runtime.columns);
      const rows = Math.max(1, options.rows ?? ctx.runtime.rows);
      const picker = createImagePickerState(
        startup.cwd,
        io,
        pickerHeight(rows),
      );
      const selectedPath = startup.selectedPath ?? firstImagePath(picker, io);
      return [
        {
          columns,
          rows,
          picker: focusSelectedEntry(picker, selectedPath, io),
          selectedPath,
          mode: 'braille',
          viewport: DEFAULT_IMAGE_VIEWPORT,
          tuning: DEFAULT_IMAGE_TUNING,
          lastError: undefined,
        },
        [],
      ];
    },
    update: (msg, model) => updateImageViewer(msg, model, io),
    view: (model) => renderImageViewer(model, ctx, io),
  };
}
