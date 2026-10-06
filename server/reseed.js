// ડેટાબેઝ ફરી તૈયાર કરવા : npm run reseed
import { db, DB_PATH } from './db.js';
import seed from './seed.js';
console.log('ડેટાબેઝ :', DB_PATH);
seed();
console.log('પૂર્ણ ✔');
