import { runCheck } from './src/checker/runCheck.js';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function tick() {
  const summary = await runCheck();
  console.log(JSON.stringify({ event: 'tick_done', ...summary }));
}

console.log('Nike UAE stock alerter started. Checking every 5 minutes.');
console.log('Press Ctrl+C to stop.\n');

// Run immediately on start, then on interval
tick();
setInterval(tick, INTERVAL_MS);
