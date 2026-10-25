import { lerp3, type BijouContext } from '@flyingrobots/bijou';

/** Follow the active theme's existing brand gradient, then return along it. */
export function themeColor(ctx: BijouContext, step: number, offset = 0): string {
  const phase = ((step / 100 + offset) % 2 + 2) % 2;
  const t = phase <= 1 ? phase : 2 - phase;
  const stops = ctx.gradient('brand');
  if (stops.length === 0) return ctx.semantic('primary').hex;
  const rgb = lerp3(stops, t);
  return '#' + rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('');
}
