export {
  scaleLinear,
  type BandScale,
  type ContinuousScale,
  type OklchSample,
  type OklchScale,
} from './scales.js';
export {
  scaleBand,
  scaleLog,
  scaleOklch,
} from './scales-ext.js';
export { BrailleCanvas } from './braille-canvas.js';
export {
  HalfBlockCanvas,
  heatmapSurface,
  type HeatmapOptions,
} from './half-block.js';
export {
  forceGraphSurface,
  forceSimulation,
  type ForceGraphRenderOptions,
  type ForceLink,
  type ForceNode,
  type ForceNodeInput,
  type ForceSimulation,
  type ForceSimulationOptions,
} from './force.js';
export {
  computeHdrHistogram,
  findFlameNode,
  flamegraphSurface,
  layoutFlamegraph,
  type FlameFrame,
  type FlameNode,
  type FlamegraphOptions,
  type HdrBin,
  type HdrHistogramResult,
} from './hierarchy.js';
export {
  areaY,
  barY,
  dot,
  lineY,
  normalizePoints,
  resolveMarkRGB,
  ruleX,
  ruleY,
  type AccessorOptions,
  type AreaMarkOptions,
  type AreaYMark,
  type BarMarkOptions,
  type BarYMark,
  type DotMark,
  type DotMarkOptions,
  type LineYMark,
  type MarkBaseOptions,
  type MarkColorInput,
  type PlotMark,
  type PlotPoint,
  type RuleXMark,
  type RuleYMark,
} from './marks.js';
export {
  computePlotLayout,
  formatTickValue,
  renderGridAndAxes,
  writePlotText,
  type PlotLayout,
} from './axes.js';
export {
  inferPlotDomains,
  renderAccessiblePlot,
  renderPipePlot,
  surfaceToPlainString,
  type InferredDomains,
} from './plot-lower.js';
export {
  plot,
  plotSurface,
  type PlotOptions,
} from './plot.js';
