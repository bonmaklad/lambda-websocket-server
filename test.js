import fs from 'fs';
import AWS from 'aws-sdk';
import { handler } from './index.js';
AWS.config.update({ region: 'ap-southeast-2' });

const testEvent = JSON.parse(fs.readFileSync('test-event.json', 'utf8'));

handler(testEvent).then((result) => {
  console.log('Result:', result);
}).catch((error) => {
  console.error('Error:', error);
});
