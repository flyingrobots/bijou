import { openDemo } from '../gallery/open-demo.js';

// The published site's front page: the landing app, a Bijou app, fills the window.
const container = document.querySelector<HTMLElement>('#surface');
if (container === null) throw new Error('BIJOU_WEB_GPU_MISSING_ELEMENT: #surface');
openDemo(container, 'landing', window.location.search, (error) => {
  if (error !== null) container.textContent = error;
});
