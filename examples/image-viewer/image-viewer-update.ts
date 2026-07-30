import type { ScopedNodeIO } from '@flyingrobots/bijou-node';
import {
  fpFocusNext,
  fpFocusPrev,
  isKeyMsg,
  isResizeMsg,
  quit,
} from '@flyingrobots/bijou-tui';
import type {
  ImageViewerAppMsg,
  ImageViewerModel,
  ImageViewerMsg,
  ImageViewerUpdate,
} from './image-viewer-contract.js';
import { resizePicker } from './image-viewer-files.js';
import { pickerHeight, pickerKeys } from './image-viewer-options.js';
import {
  enterFocusedEntry,
  enterParentDirectory,
  refreshModel,
} from './image-viewer-picker.js';
import { updateTuningKey } from './image-viewer-tuning-update.js';

function updateAppMessage(
  msg: ImageViewerAppMsg,
  model: ImageViewerModel,
  io: ScopedNodeIO,
): ImageViewerUpdate {
  switch (msg.type) {
    case 'focus-next':
      return [
        {
          ...model,
          picker: fpFocusNext(model.picker),
          lastError: undefined,
        },
        [],
      ];
    case 'focus-prev':
      return [
        {
          ...model,
          picker: fpFocusPrev(model.picker),
          lastError: undefined,
        },
        [],
      ];
    case 'enter':
      return [enterFocusedEntry(model, io), []];
    case 'back':
      return [enterParentDirectory(model, io), []];
    case 'refresh':
      return [refreshModel(model, io), []];
    case 'quit':
      return [model, [quit()]];
  }
}

export function updateImageViewer(
  msg: ImageViewerMsg,
  model: ImageViewerModel,
  io: ScopedNodeIO,
): ImageViewerUpdate {
  if (isResizeMsg(msg)) {
    return [
      {
        ...model,
        columns: Math.max(1, msg.columns),
        rows: Math.max(1, msg.rows),
        picker: resizePicker(model.picker, pickerHeight(msg.rows)),
      },
      [],
    ];
  }
  if (isKeyMsg(msg)) {
    const tuningUpdate = updateTuningKey(msg, model);
    if (tuningUpdate !== undefined) return tuningUpdate;
    if (msg.key === 'r') return [refreshModel(model, io), []];
    const pickerMsg = pickerKeys.handle(msg);
    return pickerMsg === undefined
      ? [model, []]
      : updateAppMessage(pickerMsg, model, io);
  }
  if (msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
  return updateAppMessage(msg, model, io);
}
