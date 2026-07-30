import type { BijouContext } from '@flyingrobots/bijou';
import { boxSurface, type Surface } from '@flyingrobots/bijou';
import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import {
  filePickerSurface,
  hstackSurface,
  placeSurface,
} from '@flyingrobots/bijou-tui';
import type { ImageViewerModel } from './image-viewer-contract.js';
import { resizePicker } from './image-viewer-files.js';
import { selectedEntryIndex } from './image-viewer-picker.js';
import { renderPreview } from './image-viewer-preview.js';

function renderSidebar(
  model: ImageViewerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const picker = resizePicker(model.picker, Math.max(1, height - 5));
  const pickerSurface = filePickerSurface(picker, {
    width: Math.max(1, width - 2),
    showScrollbar: true,
    focusIndicator: '>',
    selectedIndex: selectedEntryIndex(picker, model.selectedPath, io),
    dirIndicator: 'd',
    fileIndicator: '-',
  });
  return placeSurface(
    boxSurface(pickerSurface, { title: 'Images', width, ctx }),
    { width, height },
  );
}

export function renderImageViewer(
  model: ImageViewerModel,
  ctx: BijouContext,
  io: ScopedNodeIO,
): Surface {
  const width = Math.max(1, model.columns);
  const height = Math.max(1, model.rows);
  const sidebarWidth = Math.max(24, Math.min(38, Math.floor(width * 0.32)));
  const gap = width > 60 ? 1 : 0;
  const mainWidth = Math.max(1, width - sidebarWidth - gap);
  return placeSurface(
    hstackSurface(
      gap,
      renderSidebar(model, sidebarWidth, height, ctx, io),
      renderPreview(model, mainWidth, height, ctx, io),
    ),
    { width, height },
  );
}
