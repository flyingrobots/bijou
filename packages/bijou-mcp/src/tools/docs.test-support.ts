import { accordionTool } from './accordion.js';
import { alertTool } from './alert.js';
import { badgeTool } from './badge.js';
import { boxTool, headerBoxTool } from './box.js';
import { breadcrumbTool } from './breadcrumb.js';
import { constrainTool } from './constrain.js';
import { dagTool } from './dag.js';
import { enumeratedListTool } from './enumerated-list.js';
import { explainabilityTool } from './explainability.js';
import { hyperlinkTool } from './hyperlink.js';
import { inspectorTool } from './inspector.js';
import { kbdTool } from './kbd.js';
import { logTool } from './log.js';
import { paginatorTool } from './paginator.js';
import { progressBarTool } from './progress.js';
import { separatorTool } from './separator.js';
import { skeletonTool } from './skeleton.js';
import { stepperTool } from './stepper.js';
import { tableTool } from './table.js';
import { tabsTool } from './tabs.js';
import { timelineTool } from './timeline.js';
import { treeTool } from './tree.js';

export const ALL_TOOLS = [
  tableTool,
  boxTool,
  headerBoxTool,
  alertTool,
  treeTool,
  dagTool,
  timelineTool,
  accordionTool,
  stepperTool,
  badgeTool,
  separatorTool,
  skeletonTool,
  kbdTool,
  tabsTool,
  breadcrumbTool,
  paginatorTool,
  enumeratedListTool,
  hyperlinkTool,
  logTool,
  constrainTool,
  progressBarTool,
  explainabilityTool,
  inspectorTool,
] as const;
