import { ctx } from '../_shared/setup.js';
import { hyperlink, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'hyperlink examples', ctx }));
console.log();
console.log('Visit ' + hyperlink('bijou on GitHub', 'https://github.com/flyingrobots/bijou', { ctx }));
console.log();
console.log('Docs: ' + hyperlink('API Reference', 'https://github.com/flyingrobots/bijou#readme', { fallback: 'url', ctx }));
console.log();
console.log('Text only: ' + hyperlink('Click here', 'https://example.com', { fallback: 'text', ctx }));
