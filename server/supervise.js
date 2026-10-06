// ── સર્વર સૂપરવાઇઝર ──
// જો સર્વર કોઈ કારણે બંધ થાય તો તેને જાતે જ ફરી ચાલુ કરે છે,
// જેથી વિદ્યાર્થી/શિક્ષકનો લોગઇન ક્યારેય બંધ ન થાય.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, 'index.js');

let child = null;
let restarts = 0;
let stopping = false;

function log(msg) {
  console.log(`[સૂપરવાઇઝર] ${msg}`);
}

function start() {
  if (stopping) return;
  child = spawn(process.execPath, [entry], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PORT: process.env.PORT || '3000' },
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    restarts += 1;
    log(`સર્વર બંધ થયો (code=${code}, signal=${signal}) — ${restarts} વાર ફરી ચાલુ કરું છું…`);
    setTimeout(start, 1000);
  });
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopping = true;
    if (child) child.kill(sig);
    process.exit(0);
  });
}

log('સર્વર શરૂ કરું છું (auto-restart સાથે)…');
start();
