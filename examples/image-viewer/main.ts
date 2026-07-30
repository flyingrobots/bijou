import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from './image-viewer-entry.js';

export type {
  ImageRenderMode,
  ImageTuningModel,
  ImageViewerModel,
  ImageViewerOptions,
  ImageViewportModel,
} from './image-viewer-contract.js';
export { createImageViewerApp } from './image-viewer-create.js';
export { main };

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch(console.error);
}
