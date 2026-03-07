import { initDefaultContext, createNodeContext } from '@flyingrobots/bijou-node';
import { renderByMode, resolveCtx, separator, box, type BijouContext } from '@flyingrobots/bijou';

/**
 * A custom themed component demonstrating renderByMode.
 * It shows a "status spark" that looks different in each mode.
 */
function spark(label: string, value: string, options: { ctx?: BijouContext } = {}) {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => `[\${label.toUpperCase()}] \${value}`,
    accessible: () => `Status \${label}: \${value}.`,
    interactive: () => {
      const accent = ctx.semantic('accent');
      const muted = ctx.semantic('muted');
      const sparkIcon = ctx.style.styled(accent, '\u2728');
      const labelStyled = ctx.style.bold(label);
      const valueStyled = ctx.style.styled(muted, value);
      return `\${sparkIcon} \${labelStyled}: \${valueStyled}`;
    },
  }, options);
}

// 1. Interactive mode (default in TTY)
const ctx = initDefaultContext();
console.log(separator({ label: 'interactive mode', ctx }));
console.log(box(spark('Deploy', 'v1.3.0', { ctx }), { padding: { left: 2, right: 2 }, ctx }));
console.log();

function withMode(base: BijouContext, mode: BijouContext['mode']): BijouContext {
  return { ...base, mode };
}

// 2. Simulated pipe mode
const pipeCtx = withMode(createNodeContext(), 'pipe');
console.log(separator({ label: 'pipe mode fallback', ctx: pipeCtx }));
console.log(spark('Deploy', 'v1.3.0', { ctx: pipeCtx }));
console.log();

// 3. Simulated accessible mode
const accCtx = withMode(createNodeContext(), 'accessible');
console.log(separator({ label: 'accessible mode fallback', ctx: accCtx }));
console.log(spark('Deploy', 'v1.3.0', { ctx: accCtx }));
