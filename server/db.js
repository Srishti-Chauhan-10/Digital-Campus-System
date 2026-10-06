import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, '..');

/*
 * ડેટા કાયમી જગ્યાએ રાખો — એપ અપડેટ થાય ત્યારે પણ વિદ્યાર્થી/ગુણ સચવાય છે.
 * DATA  = school.db  (વિદ્યાર્થી, ગુણ, ફરિયાદ)
 * DATA  = backup/     (આપોઆપ થતા બેકઅપ)
 */
const DATA_DIR = process.env.DCS_DATA_DIR
  || (process.platform === 'win32'
        ? path.join(os.homedir(), 'AppData', 'Local', 'SchoolApp-Data')
        : path.join(os.homedir(), 'SchoolApp-Data'));

const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const EXT_DB = path.join(DATA_DIR, 'school.db');
const LEGACY_DIR = path.join(APP_DIR, 'data');
const LEGACY_DB = path.join(LEGACY_DIR, 'school.db');
fs.mkdirSync(LEGACY_DIR, { recursive: true });

fs.mkdirSync(BACKUP_DIR, { recursive: true });

// જૂની ઇન્સ્ટોલમાંથી ડેટા હોય અને નવું સ્થાન ખાલી હોય તો એક વાર ફોર્ડ કરો
if (!fs.existsSync(EXT_DB) && fs.existsSync(LEGACY_DB)) {
  fs.copyFileSync(LEGACY_DB, EXT_DB);
  fs.writeFileSync(
    path.join(DATA_DIR, 'વાંચો.txt'),
    'આ ફોલ્ડરમાં શાળાનો બધો ડેટા રહે છે.\n' +
    'એપ અપડેટ કરતી વખતે આ ફોલ્ડર કદી કાઢશો નહીં.\n' +
    'This folder holds ALL school data. Never delete it.\n'
  );
}

export const DATA_PATH = DATA_DIR;
export const BACKUP_PATH = BACKUP_DIR;
export const DB_PATH = process.env.DCS_DB || EXT_DB;

/* ── આપોઆપ બેકઅપ : દર વખતે સર્વર ચાલે ત્યારે ───────────── */
export function autoBackup(reason = 'startup') {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    const d = new Date();
    const stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    const f = path.join(BACKUP_DIR, `school_${stamp}_${reason}.db`);
    fs.copyFileSync(DB_PATH, f);
    // છેલ્લા 30 જ બેકઅપ રાખો, વાધારાના કાઢી નાખો
    const all = fs.readdirSync(BACKUP_DIR)
      .filter((x) => x.endsWith('.db'))
      .sort()
      .reverse();
    all.slice(30).forEach((x) => fs.unlinkSync(path.join(BACKUP_DIR, x)));
    return f;
  } catch { return null; }
}

export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((x) => x.endsWith('.db'))
    .map((x) => {
      const st = fs.statSync(path.join(BACKUP_DIR, x));
      return { file: x, size: st.size, time: st.mtime.toISOString() };
    })
    .sort((a, b) => b.time.localeCompare(a.time));
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  std           INTEGER NOT NULL,
  roll_no       INTEGER NOT NULL,
  name_gu       TEXT    NOT NULL,
  name_en       TEXT,
  gender        TEXT    DEFAULT 'M',
  parent_name   TEXT,
  parent_phone  TEXT,
  blood_group   TEXT,
  hostel        TEXT DEFAULT 'ના',
  photo         TEXT,
  active        INTEGER DEFAULT 1,
  UNIQUE(std, roll_no)
);

CREATE TABLE IF NOT EXISTS teachers (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  phone     TEXT UNIQUE NOT NULL,
  name_gu   TEXT NOT NULL,
  name_en   TEXT,
  role      TEXT,
  subject   TEXT,
  password  TEXT,
  active    INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  role        TEXT NOT NULL,
  student_id  INTEGER,
  teacher_id  INTEGER,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  std       INTEGER NOT NULL,
  code      TEXT NOT NULL,
  name_gu   TEXT NOT NULL,
  name_en   TEXT,
  max_marks INTEGER DEFAULT 100,
  UNIQUE(std, code)
);

CREATE TABLE IF NOT EXISTS chapters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  no         INTEGER NOT NULL,
  name       TEXT NOT NULL,
  month      TEXT,
  source     TEXT DEFAULT 'gseb',
  UNIQUE(subject_id, no)
);

CREATE TABLE IF NOT EXISTS results (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam       TEXT NOT NULL,
  marks      REAL,
  max_marks  REAL DEFAULT 100,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(student_id, subject_id, exam)
);

CREATE TABLE IF NOT EXISTS doubts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
  std         INTEGER,
  subject_code TEXT,
  chapter     TEXT,
  question    TEXT NOT NULL,
  image       TEXT,
  ai_answer   TEXT,
  ai_conf     REAL,
  ai_source   TEXT,
  status      TEXT DEFAULT 'open',      -- open | answered | closed
  teacher_id  INTEGER,
  reply       TEXT,
  replied_at  TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,            -- hostel | campus | bullying
  subject     TEXT,
  details     TEXT NOT NULL,
  location    TEXT,
  severity    TEXT DEFAULT 'સામાન્ય',
  status      TEXT DEFAULT 'નવી',       -- નવી | ચર્ચામાં | ઉકેલાઈ | નકારાયેલ
  teacher_id  INTEGER,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS helplines (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  number   TEXT NOT NULL,
  name_gu  TEXT NOT NULL,
  note_gu  TEXT,
  category TEXT,
  sort     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_doubts_status ON doubts(status);
CREATE INDEX IF NOT EXISTS idx_complaints_cat ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id, exam);
`);

export function getMeta(key, fallback = null) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : fallback;
}
export function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, String(value));
}
