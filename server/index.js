import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { db, autoBackup, DATA_PATH } from './db.js';
import seed from './seed.js';
import api from './api.js';
import { BUILD_VERSION } from './data/syllabus.js';

const BUILD_STAMP = new Date().toISOString().slice(0, 16).replace('T', ' ');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 10000;

// એક વાર જ ડેટાબેઝ તૈયાર કરો (ખાલી હોય તો સીડ કરો)
const studentCount = db.prepare('SELECT COUNT(*) c FROM students').get().c;
if (studentCount === 0) {
  console.log('· પ્રથમ વાર ચલાવવું છે — ડેટા તૈયાર થાય છે…');
  seed();
}

// દર વખતે સર્વર ચાલે ત્યારે આપોઆપ બેકઅપ
const bk = autoBackup('startup');
console.log(bk ? `  ✓ ડેટા બેકઅપ લેવાયું : ${path.basename(bk)}` : '  · બેકઅપ ન લઈ શકાયું');
console.log(`  ડેટા ફોલ્ડર : ${DATA_PATH}`);

const app = express();
app.disable('x-powered-by');

// ── લોગઇન સમસ્યાનું નિદાન : દરેક API વિનંતી નોંધો ──
app.use('/api', (req, _res, next) => {
  console.log(`  → ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', api);

// ફ્રન્ટએન્ડ બિલ્ડ ન હોય તો આપોઆપ બનાવી લે — વપરાશકરતાને કંઈ કરવાનું ન રહે
if (!fs.existsSync(path.join(ROOT, 'client', 'site', 'index.html'))) {
  console.log('· ફ્રન્ટએન્ડ તૈયાર થઈ રહ્યું છે (એક વાર) — કૃપા કરી થોડું રાહ જુઓ…');
  const r = spawnSync(process.execPath, [
    path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build', '--config', path.join(ROOT, 'client', 'vite.config.js'),
  ], { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) console.log('· ફ્રન્ટએન્ડ બિલ્ડમાં તકલીફ થઈ — નીચેનું સંદેશ જુઓ');
}

const DIST = path.join(ROOT, 'client', 'site');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, {
    // જૂની JS/CSS ફાઇલ બ્રાઉઝરમાં કેડ ન થાય, નહીં તો નવો લોગિન કોડ જ લોડ થશે
    setHeaders: (res) => res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate'),
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) =>
    res.status(200).send('<h1>ડિજિટલ કેમ્પસ સિસ્ટમ</h1><p>ફ્રન્ટએન્ડ બિલ્ડ નથી. <code>npm run build</code> ચલાવો.</p>'));
}

// 0.0.0.0 પર બિન્ધો જેથી લાઇવ પ્રિવ્યુ કામ કરે
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ઉત્તર બુનિયાદી આશ્રમ શાળા — ડિજિટલ કેમ્પસ સિસ્ટમ`);
  console.log(`  ▸ http://localhost:${PORT}`);
  console.log(`\n  ════════════════════════════════════════`);
  console.log(`   આપણી કોપી : ${BUILD_VERSION}`);
  console.log(`   તારીખ      : ${BUILD_STAMP}`);
  console.log(`  ════════════════════════════════════════\n`);
});
