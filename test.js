import fs from 'fs';
import { handler } from './index.js';

const testEvent = JSON.parse(fs.readFileSync('test-event.json', 'utf8'));

handler(testEvent).then((result) => {
  console.log('Result:', result);
}).catch((error) => {
  console.error('Error:', error);
});
