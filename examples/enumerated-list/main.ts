import { ctx } from '../_shared/setup.js';
import { enumeratedList, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'enumerated list examples', ctx }));
console.log();
console.log(enumeratedList(['First item', 'Second item', 'Third item'], { ctx }));
console.log();
console.log(enumeratedList(['Alpha', 'Bravo', 'Charlie'], { style: 'alpha', ctx }));
console.log();
console.log(enumeratedList(['Setup', 'Build', 'Test', 'Deploy'], { style: 'roman', ctx }));
console.log();
console.log(enumeratedList(['Milk', 'Eggs', 'Bread'], { style: 'bullet', ctx }));
console.log();
console.log(enumeratedList(['Item A', 'Item B', 'Item C'], { style: 'dash', ctx }));
