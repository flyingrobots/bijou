import '../index.css';
import { createRoot } from 'react-dom/client';
import { DomPage } from './dom-page.js';

const root = document.querySelector('#root');
if (root === null) throw new Error('BIJOU_WEB_GPU_MISSING_ELEMENT: #root');
createRoot(root).render(<DomPage />);
