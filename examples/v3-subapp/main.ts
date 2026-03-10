import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, isKeyMsg, type App, mount, mapCmds } from '@flyingrobots/bijou-tui';
import { badge, createSurface, stringToSurface } from '@flyingrobots/bijou';

initDefaultContext();

// --- Counter Sub-App ---

interface CounterModel {
  count: number;
}
type CounterMsg = { type: 'inc' } | { type: 'dec' };

const counterApp: App<CounterModel, CounterMsg> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if ('type' in msg) {
      if (msg.type === 'inc') return [{ count: model.count + 1 }, []];
      if (msg.type === 'dec') return [{ count: model.count - 1 }, []];
    }
    return [model, []];
  },
  view: (model) => {
    // Return a Surface
    return badge(`Counter: ${model.count}`, { variant: model.count > 0 ? 'success' : 'error' });
  }
};

// --- Parent App ---

interface MainModel {
  leftCounter: CounterModel;
  rightCounter: CounterModel;
  lastAction: string;
}

type MainMsg =
  | { type: 'leftMsg'; msg: CounterMsg }
  | { type: 'rightMsg'; msg: CounterMsg }
  | { type: 'quit' };

const parentApp: App<MainModel, MainMsg> = {
  init: () => {
    const [leftModel, leftCmds] = counterApp.init();
    const [rightModel, rightCmds] = counterApp.init();
    
    // Map init cmds to parent space
    const cmds = [
      ...mapCmds(leftCmds, (msg) => ({ type: 'leftMsg', msg })),
      ...mapCmds(rightCmds, (msg) => ({ type: 'rightMsg', msg })),
    ];

    return [{ leftCounter: leftModel, rightCounter: rightModel, lastAction: 'None' }, cmds];
  },
  
  update: (msg, model) => {
    // Intercept keyboard commands at the top level
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      
      // Route inputs to the correct sub-app
      if (msg.key === 'a') return [{ ...model, lastAction: 'Left ++' }, [() => Promise.resolve({ type: 'leftMsg', msg: { type: 'inc' } })]];
      if (msg.key === 'z') return [{ ...model, lastAction: 'Left --' }, [() => Promise.resolve({ type: 'leftMsg', msg: { type: 'dec' } })]];
      if (msg.key === 'k') return [{ ...model, lastAction: 'Right ++' }, [() => Promise.resolve({ type: 'rightMsg', msg: { type: 'inc' } })]];
      if (msg.key === 'm') return [{ ...model, lastAction: 'Right --' }, [() => Promise.resolve({ type: 'rightMsg', msg: { type: 'dec' } })]];
    }

    // Handle routed sub-app messages
    if ('type' in msg) {
      if (msg.type === 'leftMsg') {
        const [nextLeft, leftCmds] = counterApp.update(msg.msg, model.leftCounter);
        return [
          { ...model, leftCounter: nextLeft }, 
          mapCmds(leftCmds, m => ({ type: 'leftMsg', msg: m }))
        ];
      }
      
      if (msg.type === 'rightMsg') {
        const [nextRight, rightCmds] = counterApp.update(msg.msg, model.rightCounter);
        return [
          { ...model, rightCounter: nextRight }, 
          mapCmds(rightCmds, m => ({ type: 'rightMsg', msg: m }))
        ];
      }
    }
    
    return [model, []];
  },

  view: (model) => {
    // Mount the sub-apps!
    const [leftSurface] = mount(counterApp, {
      model: model.leftCounter,
      onMsg: m => ({ type: 'leftMsg', msg: m })
    });
    
    const [rightSurface] = mount(counterApp, {
      model: model.rightCounter,
      onMsg: m => ({ type: 'rightMsg', msg: m })
    });

    // Create a container surface
    const w = process.stdout.columns;
    const h = process.stdout.rows;
    const full = createSurface(w, h);
    
    // Blit the sub-app surfaces onto the parent!
    full.blit(leftSurface, 10, 5);
    full.blit(rightSurface, 40, 5);
    
    const controls = stringToSurface('Controls: [a/z] Left | [k/m] Right | [q] Quit', 60, 1);
    const status = stringToSurface(`Last action: ${model.lastAction}`, 40, 1);
    
    full.blit(controls, 10, 8);
    full.blit(status, 10, 10);

    return full;
  }
};

run(parentApp);
