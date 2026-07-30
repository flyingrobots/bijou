export function motionConstrainedSummary(mode: 'wave' | 'braille' | 'glyph-raytrace' | 'spring-timeline'): string {
  if (mode === 'wave') {
    return 'Shader motion field lowers to a truthful final-state snapshot when animation is unavailable.';
  }
  if (mode === 'braille') {
    return 'High-resolution shader motion lowers to explicit static state text instead of decorative glyph output.';
  }
  if (mode === 'glyph-raytrace') {
    return 'Raytrace shader preview lowers to scene state: two lit surfaces, one floor, and a deterministic camera.';
  }
  return 'Spring timeline preview lowers to the orchestrated motion state: camera settle, glow fade, and transition timing.';
}
