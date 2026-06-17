import type { BlockSchemaResult } from '../schema-block.js';
import type { InspectorPanelSchemaData, ReaderSurfaceOutlineItem, ReaderSurfaceSchemaData } from './types.js';

export function schemaError<Data = never>(code: string, message: string): BlockSchemaResult<Data> {
  return {
    ok: false,
    issues: [{
      severity: 'error' as const,
      code,
      message,
    }],
  };
}

export function isReaderSurfaceSchemaData(input: unknown): input is ReaderSurfaceSchemaData {
  if (!isPlainRecord(input)) {
    return false;
  }

  if (
    typeof ownDataProperty(input, 'id') !== 'string'
    || typeof ownDataProperty(input, 'title') !== 'string'
    || typeof ownDataProperty(input, 'body') !== 'string'
  ) {
    return false;
  }

  const outline = ownDataProperty(input, 'outline');
  return outline === undefined
    || (Array.isArray(outline) && outline.every(isReaderSurfaceOutlineItem));
}

export function isReaderSurfaceOutlineItem(input: unknown): input is ReaderSurfaceOutlineItem {
  return isPlainRecord(input)
    && typeof ownDataProperty(input, 'id') === 'string'
    && typeof ownDataProperty(input, 'label') === 'string';
}

export function isInspectorPanelSchemaData(input: unknown): input is InspectorPanelSchemaData {
  if (!isPlainRecord(input)) {
    return false;
  }

  if (
    typeof ownDataProperty(input, 'selectionId') !== 'string'
    || typeof ownDataProperty(input, 'label') !== 'string'
  ) {
    return false;
  }

  const details = ownDataProperty(input, 'details');
  return details === undefined
    || (Array.isArray(details) && details.every((detail) => typeof detail === 'string'));
}

export function isPlainRecord(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

export function ownDataProperty(input: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

export function textDataProperty(input: Record<string, unknown>, key: string): string | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' ? value : undefined;
}

export function textOrNumberDataProperty(input: Record<string, unknown>, key: string): string | number | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

export function textArrayDataProperty(input: Record<string, unknown>, key: string): readonly string[] | undefined {
  const value = ownDataProperty(input, key);
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}
