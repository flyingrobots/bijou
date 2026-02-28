import { ctx } from '../_shared/setup.js';
import { log, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'log examples', ctx }));
console.log();
console.log(log('debug', 'Connecting to database...', { ctx }));
console.log(log('info', 'Server started on port 3000', { ctx }));
console.log(log('warn', 'Deprecated API endpoint called', { ctx }));
console.log(log('error', 'Failed to read config file', { ctx }));
console.log(log('fatal', 'Unrecoverable error — shutting down', { ctx }));
console.log();
console.log(separator({ label: 'with timestamps', ctx }));
console.log();
console.log(log('info', 'Request received', { timestamp: true, ctx }));
console.log(log('warn', 'Slow query detected', { timestamp: true, ctx }));
console.log();
console.log(separator({ label: 'no prefix', ctx }));
console.log();
console.log(log('info', 'Just the message', { prefix: false, ctx }));
