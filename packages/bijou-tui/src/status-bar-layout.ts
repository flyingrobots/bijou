import { clipToWidth, visibleLength } from './viewport.js';

export interface StatusBarOptions {
  readonly left?: string;
  readonly center?: string;
  readonly right?: string;
  readonly width: number;
  readonly fillChar?: string;
}

export interface StatusBarSegment {
  readonly start: number;
  readonly len: number;
  readonly text: string;
}

export interface StatusBarLayout {
  readonly width: number;
  readonly fill: string;
  readonly segments: readonly StatusBarSegment[];
}

export function layoutStatusBar(
  options: StatusBarOptions,
): StatusBarLayout | null {
  const {
    left = '',
    center = '',
    right = '',
    width,
    fillChar: rawFillChar,
  } = options;
  if (width <= 0) return null;

  const fill = rawFillChar ? (rawFillChar[0] ?? ' ') : ' ';
  const leftLength = visibleLength(left);
  const centerLength = visibleLength(center);
  const rightLength = visibleLength(right);
  const clippedLeft = leftLength > width ? clipToWidth(left, width) : left;
  const actualLeftLength = Math.min(leftLength, width);

  const rightAvailable = width - actualLeftLength;
  const clippedRight =
    rightLength <= rightAvailable
      ? right
      : rightAvailable > 0
        ? clipToWidth(right, rightAvailable)
        : '';
  const actualRightLength =
    rightLength <= rightAvailable
      ? rightLength
      : Math.min(rightLength, Math.max(0, rightAvailable));

  const centerAvailable = width - actualLeftLength - actualRightLength;
  let clippedCenter =
    centerLength <= centerAvailable
      ? center
      : centerAvailable > 0
        ? clipToWidth(center, centerAvailable)
        : '';
  let actualCenterLength =
    centerLength <= centerAvailable
      ? centerLength
      : Math.min(centerLength, Math.max(0, centerAvailable));

  const rightStart = width - actualRightLength;
  let centerStart = Math.max(
    actualLeftLength,
    Math.floor((width - actualCenterLength) / 2),
  );
  if (centerStart + actualCenterLength > rightStart) {
    centerStart = Math.max(actualLeftLength, rightStart - actualCenterLength);
    if (centerStart + actualCenterLength > rightStart) {
      const spaceForCenter = rightStart - centerStart;
      if (spaceForCenter > 0) {
        clippedCenter = clipToWidth(clippedCenter, spaceForCenter);
        actualCenterLength = spaceForCenter;
      } else {
        clippedCenter = '';
        actualCenterLength = 0;
      }
    }
  }

  const segments: StatusBarSegment[] = [];
  if (actualLeftLength > 0) {
    segments.push({
      start: 0,
      len: actualLeftLength,
      text: clippedLeft,
    });
  }
  if (actualCenterLength > 0) {
    segments.push({
      start: centerStart,
      len: actualCenterLength,
      text: clippedCenter,
    });
  }
  if (actualRightLength > 0) {
    segments.push({
      start: rightStart,
      len: actualRightLength,
      text: clippedRight,
    });
  }
  segments.sort((a, b) => a.start - b.start);
  return { width, fill, segments };
}
