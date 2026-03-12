import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, badge, enumeratedList, kbd, separator, surfaceToString } from '@flyingrobots/bijou';
import {
  run,
  createKeyMap,
  createFramedApp,
  type FramePage,
  type PageTransition,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

type Msg = 
  | { type: 'set-transition', transition: PageTransition };

interface PageModel {
  selectedTransition: PageTransition;
}

const TRANSITIONS: PageTransition[] = ['none', 'wipe', 'dissolve', 'grid', 'fade', 'melt', 'matrix', 'scramble'];
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

function updatePageModel(msg: Msg, model: PageModel): [PageModel, []] {
  if (msg.type === 'set-transition') {
    return [{ ...model, selectedTransition: msg.transition }, []];
  }
  return [model, []];
}

function createPageKeyMap() {
  const km = createKeyMap<Msg>();
  // Bind 1-8 to set transition
  TRANSITIONS.forEach((t, i) => {
    km.bind((i + 1).toString(), `Use ${t}`, { type: 'set-transition', transition: t });
  });
  return km;
}

function renderContent(pageName: string, model: PageModel, width: number, height: number): string {
  void height;
  const list = enumeratedList(
    TRANSITIONS.map((transition) => transition === model.selectedTransition ? `${transition} ${badgeText('active', 'success')}` : transition),
    { style: 'arabic', indent: 2 }
  );

  const content = [
    `Currently on ${badgeText(pageName, 'primary')}`,
    '',
    'Press 1-8 to select the NEXT transition:',
    '',
    list,
    '',
    `Press ${kbd('[')} or ${kbd(']')} to switch pages and play the animation.`,
  ].join('\n');

  return box(content, { width: Math.max(40, width - 4), padding: { top: 1, left: 2, right: 2 } });
}

function makePage(id: string, title: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ selectedTransition: 'melt' }, []],
    update: updatePageModel,
    keyMap: createPageKeyMap(),
    layout: (model) => ({
      kind: 'pane',
      paneId: `${id}-main`,
      render: (w, h) => renderContent(title, model, w, h),
    }),
  };
}

const app = createFramedApp<PageModel, Msg>({
  title: 'Bijou Transitions Demo',
  pages: [
    makePage('page-a', 'Page A'),
    makePage('page-b', 'Page B'),
  ],
  transition: 'none', // base default
  transitionDuration: 600,
  transitionOverride: (model) => model.selectedTransition,
  enableCommandPalette: true,
});

run(app);
