import './index.css';
import { createRoot } from 'react-dom/client';
import { ShowcasePage } from './chrome/showcase-page.js';
import { createShowcaseStore } from './showcase-store.js';

const root = document.querySelector('#root');
if (root === null) throw new Error('BIJOU_WEB_GPU_MISSING_ELEMENT: #root');
createRoot(root).render(<ShowcasePage store={createShowcaseStore()} />);
