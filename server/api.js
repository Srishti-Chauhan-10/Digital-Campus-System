import express from 'express';
import crypto from 'node:crypto';
import { db, getMeta, autoBackup, listBackups, DATA_PATH, DB_PATH } from './db.js';
import { SYLLABUS, EXAMS, RULE, examsFor, mainExamsFor, STUDENT_PASSWORDS, SCHOOL, DEFAULT_TEACHER_PASSWORD, BUILD_VERSION } from './data/syllabus.js';
import { answerDoubt, SUBJECT_NAMES } from './ai/doubtEngine.js';
import { rankOf, evaluate, gradeOf as gOf } from './ai/grading.js';

export const api = express.Router();
api.use(express.json({ limit: '4mb' }));

// ───────────────────────── helpers ─────────────────────────
const ok = (res, data) => res.json({ ok: true, ...data });
const fail = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

function createSession(role, { student_id = null, teacher_id = null } = {}) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, role, student_id, teacher_id) VALUES (?,?,?,?)')
    .run(token, role, student_id, teacher_id);
  return token;
}

function currentUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!s) return null;
  if (s.role === 'student') {
    const st = db.prepare('SELECT * FROM students WHERE id = ?').get(s.student_id);
    return st ? { role: 'student', token, student: st } : null;
  }
  const t = db.prepare('SELECT * FROM teachers WHERE id = ?').get(s.teacher_id);
  return t ? { role: 'teacher', token, teacher: t } : null;
}

function requireRole(role) {
  return (req, res, next) => {
    const u = currentUser(req);
    if (!u) return fail(res, 'લોગઇન કરો.', 401);
    if (u.role !== role) return fail(res, 'અનુમતિ નથી.', 403);
    req.user = u;
    next();
  };
}

// એક વિષય + એક પરીક્ષા : આખી વર્ગનો રાન્ક (student_id -> rank)
const ranksFor = (subjectId, exam) => {
  const rows = db.prepare('SELECT student_id, marks FROM results WHERE subject_id=? AND exam=?')
    .all(subjectId, exam);
  return rankOf(rows.map((r) => ({ id: r.student_id, marks: r.marks })));
};

const gradeOf = (p) =>
  p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'E';

// ───────────────────────── school ─────────────────────────
api.get('/school', (_req, res) => ok(res, { school: SCHOOL, version: BUILD_VERSION, exams: EXAMS }));

// ───────────────────────── AUTH ─────────────────────────
api.post('/auth/student', (req, res) => {
  const rollRaw = String(req.body.rollNo ?? req.body.roll_no ?? req.body.roll ?? '').trim();
  const password = String(req.body.password ?? '').trim();
  const roll = parseInt(rollRaw, 10);

  if (!roll || roll <= 0) return fail(res, 'રોલ નંબર સાચો લખો.');
  if (!password) return fail(res, 'પાસવર્ડ લખો.');

  // ધોરણ પાસવર્ડથી ઓળખાય છે
  for (const std of [9, 10]) {
    if (STUDENT_PASSWORDS[std] !== password) continue;
    const st = db.prepare('SELECT * FROM students WHERE std=? AND roll_no=?').get(std, roll);
    if (st) {
      const token = createSession('student', { student_id: st.id });
      return ok(res, {
        token, role: 'student',
        student: { ...st, subject_hint: null },
        greeting: `નમસ્તે ${st.name_gu} 👋`,
        welcome: `${st.name_gu}, ઉત્તર બુનિયાદી આશ્રમ શાળા ડિજિટલ કેમ્પસ સિસ્ટમમાં સ્વાગત છે`,
      });
    }
  }

  // સ્પષ્ટ તપાસ
  const exists = db.prepare('SELECT std FROM students WHERE roll_no=?').get(roll);
  if (exists) {
    return fail(res, `આ રોલ નંબર ધોરણ ${exists.std} નો છે — પાસવર્ડ student${exists.std} રાખો.`);
  }
  fail(res, 'આ રોલ નંબરનો વિદ્યાર્થી મળ્યો નથી. શિક્ષકને જાણ કરો.');
});

api.post('/auth/teacher', (req, res) => {
  let phone = String(req.body.phone ?? '').replace(/\D/g, '');
  if (phone.length === 11 && phone.startsWith('0')) phone = phone.slice(1);
  const password = String(req.body.password ?? '').trim();

  if (phone.length !== 10) return fail(res, '10 અંકનો મોબાઇલ નંબર લખો.');
  if (!password) return fail(res, 'પાસવર્ડ લખો.');

  const t = db.prepare('SELECT * FROM teachers WHERE phone = ? AND active = 1').get(phone);
  if (!t) return fail(res, 'આ નંબર નોંધાયેલ નથી. ફક્ત નોંધાયેલા 3 નંબર જ ચાલુ થાય છે.');
  if ((t.password || DEFAULT_TEACHER_PASSWORD) !== password) return fail(res, 'પાસવર્ડ ખોટો છે.');

  const token = createSession('teacher', { teacher_id: t.id });
  ok(res, {
    token, role: 'teacher',
    teacher: { id: t.id, name_gu: t.name_gu, name_en: t.name_en, role: t.role, subject: t.subject, phone: t.phone },
    greeting: `નમસ્તે ${t.name_gu} 👋`,
    welcome: `${SCHOOL.nameGu} શિક્ષક પોર્ટલમાં તમારું સ્વાગત છે`,
  });
});

api.post('/auth/logout', (req, res) => {
  const u = currentUser(req);
  if (u) db.prepare('DELETE FROM sessions WHERE token = ?').run(u.token);
  ok(res, {});
});

api.get('/auth/me', (req, res) => {
  const u = currentUser(req);
  if (!u) return fail(res, 'સેશન સમાપ્ત.', 401);
  if (u.role === 'student') {
    const st = db.prepare('SELECT * FROM students WHERE id=?').get(u.student.id);
    ok(res, { role: 'student', student: st });
  } else {
    const t = db.prepare('SELECT id, name_gu, name_en, role, subject, phone FROM teachers WHERE id=?').get(u.teacher.id);
    ok(res, { role: 'teacher', teacher: t });
  }
});

// ───────────────────────── SYLLABUS (both) ─────────────────────────
api.get('/syllabus/:std', (req, res) => {
  const std = parseInt(req.params.std, 10);
  if (!SYLLABUS[std]) return fail(res, 'ધોરણ ખોટું છે.');
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(std);
  const chapters = db.prepare(
    'SELECT c.* FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE s.std=? ORDER BY c.subject_id, c.no'
  ).all(std);
  const out = subjects.map((s) => ({
    id: s.id, code: s.code, gu: s.name_gu, en: s.name_en, max_marks: s.max_marks,
    chapters: chapters.filter((c) => c.subject_id === s.id).map((c) => ({ no: c.no, name: c.name, month: c.month })),
  }));
  ok(res, { std, subjects: out });
});

api.get('/syllabus/subject/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM subjects WHERE id=?').get(req.params.id);
  if (!s) return fail(res, 'વિષય મળ્યો નથી.');
  const chapters = db.prepare('SELECT id,no,name,month,source FROM chapters WHERE subject_id=? ORDER BY no').all(s.id);
  ok(res, { subject: { id: s.id, code: s.code, gu: s.name_gu, en: s.name_en, std: s.std }, chapters });
});

// ───────────────────────── STUDENT AREA ─────────────────────────
const student = express.Router();
student.use(requireRole('student'));

student.get('/dashboard', (req, res) => {
  const st = req.user.student;
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(st.std);
  const exams = db.prepare('SELECT DISTINCT exam FROM results WHERE student_id=?').all(st.id).map((r) => r.exam);
  const myComplaints = db.prepare(
    'SELECT * FROM complaints WHERE student_id=? ORDER BY id DESC LIMIT 20'
  ).all(st.id);
  const myDoubts = db.prepare(
    'SELECT id,question,status,created_at FROM doubts WHERE student_id=? ORDER BY id DESC LIMIT 20'
  ).all(st.id);
  const openDoubts = db.prepare("SELECT COUNT(*) c FROM doubts WHERE student_id=? AND status='open'").get(st.id).c;
  const openComplaints = db.prepare("SELECT COUNT(*) c FROM complaints WHERE student_id=? AND status='નવી'").get(st.id).c;
  const results = db.prepare(
    `SELECT r.*, s.name_gu AS subject_gu, s.code AS subject_code
     FROM results r JOIN subjects s ON s.id=r.subject_id WHERE r.student_id=?`
  ).all(st.id);
  ok(res, {
    student: st, subjects, exams, myComplaints, myDoubts, results,
    stats: { openDoubts, openComplaints, totalSubjects: subjects.length },
  });
});

student.get('/results', (req, res) => {
  const st = req.user.student;
  const sid = st.id;
  const rule = RULE[st.std];
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(st.std);
  const exams = examsFor(st.std);

  const rows = db.prepare(
    `SELECT r.*, s.name_gu AS subject_gu, s.code AS subject_code
     FROM results r JOIN subjects s ON s.id=r.subject_id WHERE r.student_id=?`
  ).all(sid);

  const bySubject = {};
  for (const r of rows) {
    bySubject[r.subject_id] = bySubject[r.subject_id] || {};
    bySubject[r.subject_id][r.exam] = r.marks;
  }

  const list = subjects.map((sub) => {
    const marks = bySubject[sub.id] || {};
    const ev = evaluate(st.std, marks);

    // દરેક પરીક્ષાનો પોતાનો રાન્ક (આ વિષયમાં, આ વર્ગમાં)
    const ranks = {};
    for (const e of exams) {
      const rk = ranksFor(sub.id, e.code);
      ranks[e.code] = rk.get(sid) ?? null;
    }

    return {
      subjectId: sub.id,
      subject: sub.name_gu,
      code: sub.code,
      maxMarks: sub.max_marks,
      marks,
      result: ev,
      ranks,
    };
  });

  ok(res, {
    student: { id: sid, name_gu: st.name_gu, std: st.std, roll_no: st.roll_no },
    rule, exams, mainExams: mainExamsFor(st.std), subjects: list,
  });
});

student.get('/doubt/:id', (req, res) => {
  const d = db.prepare('SELECT * FROM doubts WHERE id=? AND student_id=?').get(req.params.id, req.user.student.id);
  if (!d) return fail(res, 'પ્રશ્ન મળ્યો નથી.', 404);
  ok(res, { doubt: d });
});

student.post('/doubt', (req, res) => {
  const st = req.user.student;
  const question = String(req.body.question || '').trim();
  if (!question) return fail(res, 'પ્રશ્ન લખો.');
  if (question.length > 2000) return fail(res, 'પ્રશ્ન ખૂબ લાંબો છે (2000 અક્ષર સુધી).');

  const ai = answerDoubt({ question, std: st.std, subjectHint: req.body.subject });
  const info = db.prepare(
    `INSERT INTO doubts (student_id, std, subject_code, chapter, question, ai_answer, ai_conf, ai_source, status)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(st.id, st.std, ai.subject, ai.chapter, question, ai.answer, ai.confidence, ai.source, 'open');

  ok(res, {
    id: info.lastInsertRowid,
    answer: ai.answer, subject: ai.subject, subjectName: ai.subject ? SUBJECT_NAMES[ai.subject] : null,
    chapter: ai.chapter, confidence: ai.confidence, source: ai.source,
    sentToTeacher: true,
    note: ai.needTeacher
      ? 'આ પ્રશ્ન શિક્ષકને મોકલાયો છે. જવાબ આવતાં જ અહીં દેખાશે.'
      : 'જવાબ સાથે શિક્ષકને પણ મોકલાયો છે — તેઓ ચકાસી શકે છે.',
  });
});

student.post('/complaint', (req, res) => {
  const st = req.user.student;
  const category = String(req.body.category || '');
  if (!['hostel', 'campus', 'bullying'].includes(category)) return fail(res, 'શ્રેણી પસંદ કરો.');
  const details = String(req.body.details || '').trim();
  if (details.length < 10) return fail(res, 'વિગત ઓછામાં ઓછા 10 અક્ષરની લખો.');
  if (category === 'bullying' && details.length < 20)
    return fail(res, 'હિંગકરી વિશે લખતાં વધુ વિગત (ક્યારે, કોણ, શું થયું) આપો.');

  const info = db.prepare(
    `INSERT INTO complaints (student_id, category, subject, details, location, severity)
     VALUES (?,?,?,?,?,?)`
  ).run(st.id, category, String(req.body.subject || '').trim() || null, details,
    String(req.body.location || '').trim() || null, String(req.body.severity || 'સામાન્ય'));

  ok(res, { id: info.lastInsertRowid, status: 'નવી' });
});

student.get('/helplines', (_req, res) =>
  ok(res, { helplines: db.prepare('SELECT * FROM helplines ORDER BY sort').all() }));

student.get('/complaints', (req, res) =>
  ok(res, { complaints: db.prepare('SELECT * FROM complaints WHERE student_id=? ORDER BY id DESC').all(req.user.student.id) }));

api.use('/student', student);

// ───────────────────────── TEACHER AREA ─────────────────────────
const teacher = express.Router();
teacher.use(requireRole('teacher'));

// ── બેકઅપ : ડેટા સુરક્ષિત રાખવા ─────────────────────────
teacher.get('/backups', (_req, res) => {
  ok(res, { list: listBackups(), dataFolder: DATA_PATH });
});

teacher.post('/backup-now', (_req, res) => {
  const f = autoBackup('manual');
  ok(res, { saved: !!f, message: f ? 'બેકઅપ લઈ લીધું ✅' : 'બેકઅપ નહીં લઈ શકાયું.' });
});

teacher.get('/backup-download', (_req, res) => {
  autoBackup('download');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="school-data-${new Date().toISOString().slice(0, 10)}.db"`);
  res.sendFile(DB_PATH);
});

// શિક્ષક પોતાનો પાસવર્ડ બદલી શકે — ડેટાબેઝમાં સચવાય છે
teacher.post('/password', (req, res) => {
  const cur = String(req.body.current ?? '').trim();
  const next = String(req.body.next ?? '').trim();

  if (!next || next.length < 4) return fail(res, 'નવો પાસવર્ડ ઓછામાં ઓછા 4 અક્ષરનો રાખો.');
  if (!/^[A-Za-z0-9@#$_-]{4,30}$/.test(next)) {
    return fail(res, 'ફક્ત અક્ષર, અંક અને @ # $ _ - વાપરી શકાય છે (4-30 અક્ષર).');
  }

  const tid = req.user.teacher?.id;
  if (!tid) return fail(res, 'શિક્ષક મળ્યા નથી.');
  const t = db.prepare('SELECT * FROM teachers WHERE id=?').get(tid);
  if ((t.password || DEFAULT_TEACHER_PASSWORD) !== cur) return fail(res, 'હાલનો પાસવર્ડ ખોટો છે.');

  db.prepare('UPDATE teachers SET password=? WHERE id=?').run(next, t.id);
  ok(res, { saved: true, message: 'નવો પાસવર્ડ સચવાઈ ગયો ✅' });
});

teacher.get('/my-password-status', (req, res) => {
  const tid = req.user.teacher?.id;
  const t = tid ? db.prepare('SELECT password FROM teachers WHERE id=?').get(tid) : null;
  ok(res, { changed: !!(t && t.password) });
});

teacher.get('/dashboard', (req, res) => {
  const openDoubts = db.prepare("SELECT COUNT(*) c FROM doubts WHERE status='open'").get().c;
  const newComplaints = db.prepare("SELECT COUNT(*) c FROM complaints WHERE status='નવી'").get().c;
  const hostel = db.prepare("SELECT COUNT(*) c FROM complaints WHERE category='hostel' AND status='નવી'").get().c;
  const campus = db.prepare("SELECT COUNT(*) c FROM complaints WHERE category='campus' AND status='નવી'").get().c;
  const bullying = db.prepare("SELECT COUNT(*) c FROM complaints WHERE category='bullying' AND status='નવી'").get().c;
  const students = db.prepare('SELECT COUNT(*) c FROM students WHERE active=1').get().c;
  const recent = db.prepare(
    `SELECT d.*, s.name_gu, s.roll_no, s.std FROM doubts d
     LEFT JOIN students s ON s.id=d.student_id ORDER BY d.id DESC LIMIT 8`
  ).all();
  ok(res, { stats: { openDoubts, newComplaints, hostel, campus, bullying, students }, recentDoubts: recent });
});

teacher.get('/doubts', (req, res) => {
  const { status, std, subject } = req.query;
  let sql = `SELECT d.*, s.name_gu, s.roll_no, s.std FROM doubts d
             LEFT JOIN students s ON s.id=d.student_id WHERE 1=1`;
  const args = [];
  if (status) { sql += ' AND d.status=?'; args.push(status); }
  if (std) { sql += ' AND d.std=?'; args.push(parseInt(std, 10)); }
  if (subject) { sql += ' AND d.subject_code=?'; args.push(subject); }
  sql += " ORDER BY (d.status='open') DESC, d.id DESC";
  ok(res, { doubts: db.prepare(sql).all(...args) });
});

teacher.post('/doubt/:id/reply', (req, res) => {
  const reply = String(req.body.reply || '').trim();
  if (!reply) return fail(res, 'જવાબ લખો.');
  db.prepare("UPDATE doubts SET reply=?, replied_at=datetime('now'), status='answered', teacher_id=? WHERE id=?")
    .run(reply, req.user.teacher.id, req.params.id);
  ok(res, {});
});

teacher.post('/doubt/:id/close', (req, res) => {
  db.prepare("UPDATE doubts SET status='closed' WHERE id=?").run(req.params.id);
  ok(res, {});
});

teacher.get('/complaints', (req, res) => {
  const { category, status } = req.query;
  let sql = `SELECT c.*, s.name_gu, s.roll_no, s.std FROM complaints c
             LEFT JOIN students s ON s.id=c.student_id WHERE 1=1`;
  const args = [];
  if (category) { sql += ' AND c.category=?'; args.push(category); }
  if (status) { sql += ' AND c.status=?'; args.push(status); }
  sql += ' ORDER BY c.id DESC';
  ok(res, { complaints: db.prepare(sql).all(...args) });
});

teacher.post('/complaint/:id/status', (req, res) => {
  const status = String(req.body.status || '');
  const note = String(req.body.note || '').trim() || null;
  if (!['નવી', 'ચર્ચામાં', 'ઉકેલાઈ', 'નકારાયેલ'].includes(status)) return fail(res, 'સ્થિતિ ખોટી છે.');
  db.prepare('UPDATE complaints SET status=?, note=COALESCE(?,note) WHERE id=?').run(status, note, req.params.id);
  ok(res, {});
});

teacher.get('/students', (req, res) => {
  const std = req.query.std ? parseInt(req.query.std, 10) : null;
  const rows = std
    ? db.prepare('SELECT * FROM students WHERE std=? ORDER BY roll_no').all(std)
    : db.prepare('SELECT * FROM students ORDER BY std DESC, roll_no').all();
  ok(res, { students: rows });
});

teacher.post('/students', (req, res) => {
  const std = parseInt(req.body.std, 10);
  const roll = parseInt(req.body.roll_no ?? req.body.rollNo, 10);
  const name = String(req.body.name_gu || req.body.name || '').trim();
  if (![9, 10].includes(std)) return fail(res, 'ધોરણ 9 કે 10 પસંદ કરો.');
  if (!roll || roll <= 0) return fail(res, 'રોલ નંબર લખો.');
  if (!name) return fail(res, 'વિદ્યાર્થીનું નામ લખો.');
  const dup = db.prepare('SELECT id FROM students WHERE std=? AND roll_no=?').get(std, roll);
  if (dup) return fail(res, `આ રોલ નંબર (${std}) પહેલેથી છે.`);
  const info = db.prepare('INSERT INTO students (std, roll_no, name_gu, name_en, gender, parent_name, parent_phone, blood_group, hostel) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(std, roll, name, String(req.body.name_en || '').trim() || null,
      String(req.body.gender || 'M'), String(req.body.parent_name || '').trim() || null,
      String(req.body.parent_phone || '').replace(/\D/g, '') || null,
      String(req.body.blood_group || '').trim() || null, String(req.body.hostel || 'ના'));
  ok(res, { id: info.lastInsertRowid });
});

teacher.post('/students/bulk', (req, res) => {
  // ટેક્સ્ટ : "roll,name" કે "roll,name" પ્તા પંકિત અથવા CSV લાઇન દીર્ઘ
  const std = parseInt(req.body.std, 10);
  const raw = String(req.body.text || '').trim();
  if (![9, 10].includes(std)) return fail(res, 'ધોરણ 9 કે 10 પસંદ કરો.');
  if (!raw) return fail(res, 'ડેટા લખો.');

  const insert = db.prepare(
    'INSERT INTO students (std, roll_no, name_gu) VALUES (?,?,?) ON CONFLICT(std,roll_no) DO UPDATE SET name_gu=excluded.name_gu'
  );
  const results = { added: 0, updated: 0, errors: [] };
  db.transaction(() => {
    for (const line of raw.split(/\n+/)) {
      const l = line.trim();
      if (!l || l.startsWith('#')) continue;
      const parts = l.split(/[,;\t|]/).map((s) => s.trim());
      const roll = parseInt(parts[0], 10);
      const name = parts.slice(1).join(' ').trim();
      if (!roll || !name) { results.errors.push(`લાઇન બગડી : ${l}`); continue; }
      const before = db.prepare('SELECT id FROM students WHERE std=? AND roll_no=?').get(std, roll);
      insert.run(std, roll, name);
      if (before) results.updated++; else results.added++;
    }
  })();
  ok(res, results);
});

teacher.delete('/students/:id', (req, res) => {
  db.prepare('UPDATE students SET active=0 WHERE id=?').run(req.params.id);
  ok(res, {});
});

// ── અભ્યાસક્રમ (syllabus) management ──
teacher.post('/syllabus/chapter', (req, res) => {
  const subjectId = parseInt(req.body.subjectId, 10);
  const name = String(req.body.name || '').trim();
  if (!subjectId || !name) return fail(res, 'વિષય અને પ્રકરણનું નામ લખો.');
  const maxNo = db.prepare('SELECT COALESCE(MAX(no),0) m FROM chapters WHERE subject_id=?').get(subjectId).m;
  db.prepare('INSERT INTO chapters (subject_id,no,name,month,source) VALUES (?,?,?,?,?)')
    .run(subjectId, maxNo + 1, name, String(req.body.month || '').trim() || null, 'teacher');
  ok(res, {});
});

teacher.post('/syllabus/chapter/bulk', (req, res) => {
  const subjectId = parseInt(req.body.subjectId, 10);
  const raw = String(req.body.text || '').trim();
  if (!subjectId || !raw) return fail(res, 'ડેટા લખો.');
  let maxNo = db.prepare('SELECT COALESCE(MAX(no),0) m FROM chapters WHERE subject_id=?').get(subjectId).m;
  let added = 0;
  db.transaction(() => {
    for (const line of raw.split(/\n+/)) {
      const l = line.trim();
      if (!l || l.startsWith('#')) continue;
      const [name, month] = l.split(/[,;\t|]/).map((s) => s.trim());
      if (!name) continue;
      db.prepare('INSERT INTO chapters (subject_id,no,name,month,source) VALUES (?,?,?,?,?)')
        .run(subjectId, ++maxNo, name, month || null, 'teacher');
      added++;
    }
  })();
  ok(res, { added });
});

teacher.delete('/syllabus/chapter/:id', (req, res) => {
  db.prepare('DELETE FROM chapters WHERE id=?').run(req.params.id);
  ok(res, {});
});

teacher.post('/syllabus/subject', (req, res) => {
  const std = parseInt(req.body.std, 10);
  const code = String(req.body.code || '').trim().toUpperCase();
  const gu = String(req.body.name_gu || '').trim();
  if (![9, 10].includes(std)) return fail(res, 'ધોરણ 9 કે 10 પસંદ કરો.');
  if (!code || !gu) return fail(res, 'વિષય કોડ અને નામ લખો.');
  db.prepare('INSERT INTO subjects (std,code,name_gu,name_en,max_marks) VALUES (?,?,?,?,?) ON CONFLICT(std,code) DO UPDATE SET name_gu=excluded.name_gu')
    .run(std, code, gu, String(req.body.name_en || '').trim() || null, parseInt(req.body.max_marks, 10) || 100);
  ok(res, {});
});

teacher.delete('/syllabus/subject/:id', (req, res) => {
  db.prepare('DELETE FROM subjects WHERE id=?').run(req.params.id);
  ok(res, {});
});

// ── ગુણ (marks) upload — roll no wise ──
teacher.get('/marks/:std/:exam', (req, res) => {
  const std = parseInt(req.params.std, 10);
  const exam = String(req.params.exam);
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(std);
  const students = db.prepare('SELECT * FROM students WHERE std=? AND active=1 ORDER BY roll_no').all(std);
  const codes = subjects.map((s) => s.code);
  if (!codes.length) return ok(res, { subjects: [], rows: [] });

  const placeholders = codes.map(() => '?').join(',');
  const marks = db.prepare(
    `SELECT r.student_id, s.code, r.marks FROM results r
     JOIN subjects s ON s.id=r.subject_id
     WHERE r.exam=? AND s.code IN (${placeholders})`
  ).all(exam, ...codes);

  const byStudent = {};
  for (const m of marks) {
    byStudent[m.student_id] = byStudent[m.student_id] || {};
    byStudent[m.student_id][m.code] = m.marks;
  }
  ok(res, {
    std, exam,
    examName: examsFor(std).find((e) => e.code === exam)?.gu || exam,
    examMax: examsFor(std).find((e) => e.code === exam)?.maxMarks ?? null,
    examPass: examsFor(std).find((e) => e.code === exam)?.pass ?? null,
    isInternal: !!examsFor(std).find((e) => e.code === exam)?.internal,
    subjects: subjects.map((s) => ({ id: s.id, code: s.code, gu: s.name_gu, max: s.max_marks })),
    rows: students.map((s) => ({
      student_id: s.id, roll_no: s.roll_no, name_gu: s.name_gu, marks: byStudent[s.id] || {},
    })),
  });
});

teacher.post('/marks/save', (req, res) => {
  const std = parseInt(req.body.std, 10);
  const exam = String(req.body.exam || '');
  const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
  if (![9, 10].includes(std)) return fail(res, 'ધોરણ 9 કે 10 પસંદ કરો.');
  const examDef = examsFor(std).find((e) => e.code === exam);
  if (!examDef) return fail(res, 'પરીક્ષા પસંદ કરો.');

  const subjByCode = {};
  for (const s of db.prepare('SELECT id, code, max_marks FROM subjects WHERE std=?').all(std)) subjByCode[s.code] = s;

  const upsert = db.prepare(
    `INSERT INTO results (student_id, subject_id, exam, marks, max_marks, updated_at)
     VALUES (?,?,?,?,?,datetime('now'))
     ON CONFLICT(student_id, subject_id, exam)
     DO UPDATE SET marks=excluded.marks, max_marks=excluded.max_marks, updated_at=datetime('now')`
  );
  const clear = db.prepare('DELETE FROM results WHERE student_id=? AND subject_id=? AND exam=?');

  let saved = 0, errors = 0;
  db.transaction(() => {
    for (const e of entries) {
      if (!e || typeof e !== 'object') { errors++; continue; }
      const subj = subjByCode[e.code];
      if (!subj) continue;
      const rows = Array.isArray(e.rows) ? e.rows : [];
      for (const r of rows) {
        if (!r || typeof r !== 'object') { errors++; continue; }
        const sid = parseInt(r.student_id, 10);
        if (!sid) { errors++; continue; }
        const v = r.marks;
        if (v === '' || v === null || v === undefined) { clear.run(sid, subj.id, exam); continue; }
        const num = Number(v);
        // ગુણ પરીક્ષાના પોતાના પૂરા ગુણ કરતાં વધુ ન હોવો જોઈએ
        const cap = examDef.maxMarks ?? subj.max_marks;
        if (Number.isNaN(num) || num < 0 || num > cap) { errors++; continue; }
        upsert.run(sid, subj.id, exam, num, cap);
        saved++;
      }
    }
  })();
  ok(res, { saved, errors });
});

teacher.get('/result-sheet/:std/:exam', (req, res) => {
  const std = parseInt(req.params.std, 10);
  const exam = String(req.params.exam);
  const rule = RULE[std];
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(std);
  if (!subjects.length) return ok(res, { rows: [], subjects, examName: exam, rule });

  const codes = subjects.map((s) => s.code);
  const ph = codes.map(() => '?').join(',');
  const students = db.prepare('SELECT * FROM students WHERE std=? AND active=1 ORDER BY roll_no').all(std);
  const marks = db.prepare(
    `SELECT r.student_id, s.code, r.marks FROM results r JOIN subjects s ON s.id=r.subject_id
     WHERE r.exam=? AND s.code IN (${ph})`
  ).all(exam, ...codes);

  const by = {};
  for (const m of marks) { (by[m.student_id] = by[m.student_id] || {})[m.code] = m.marks; }

  // આ પરીક્ષાનો આ વિષયદીઠ વર્ગ રાન્ક
  const rankMaps = {};
  for (const sub of subjects) rankMaps[sub.code] = ranksFor(sub.id, exam);

  const rows = students.map((st) => {
    const m = by[st.id] || {};
    const ranks = {};
    for (const sub of subjects) ranks[sub.code] = rankMaps[sub.code]?.get(st.id) ?? null;
    return {
      student_id: st.id, roll_no: st.roll_no, name_gu: st.name_gu,
      marks: m, rank: ranks,
      examTotal: codes.reduce((a, c) => a + (m[c] || 0), 0),
      isAbsent: codes.every((c) => m[c] === null || m[c] === undefined),
    };
  });

  // આ પરીક્ષામાં પ્રતિ વિષયનો કુલ
  const subjectTotals = subjects.map((sub) => {
    const vals = rows.map((r) => r.marks[sub.code]).filter((v) => v !== null && v !== undefined);
    return { code: sub.code, gu: sub.name_gu, total: vals.reduce((a, b) => a + b, 0), count: vals.length };
  });

  ok(res, {
    subjects, rows, rule,
    exam, examName: examsFor(std).find((e) => e.code === exam)?.gu || exam,
    examMax: examsFor(std).find((e) => e.code === exam)?.maxMarks ?? null,
    examPass: examsFor(std).find((e) => e.code === exam)?.pass ?? null,
    isInternal: !!examsFor(std).find((e) => e.code === exam)?.internal,
    subjectTotals,
  });
});

// આખી વર્ગનો સંપૂર્ણ પરિણામ (દરેક પરીક્ષા + રાન્ક)
teacher.get('/result-sheet-full/:std', (req, res) => {
  const std = parseInt(req.params.std, 10);
  const rule = RULE[std];
  const subjects = db.prepare('SELECT * FROM subjects WHERE std=? ORDER BY id').all(std);
  const students = db.prepare('SELECT * FROM students WHERE std=? AND active=1 ORDER BY roll_no').all(std);
  const exams = examsFor(std);

  const rows = db.prepare('SELECT student_id, subject_id, exam, marks FROM results').all();
  const byStu = {};
  const ranks = {};
  for (const sub of subjects) {
    for (const e of exams) ranks[sub.id + ':' + e.code] = ranksFor(sub.id, e.code);
  }

  const list = students.map((st) => {
    const subjectsOut = subjects.map((sub) => {
      const marks = {};
      for (const e of exams) {
        const r = rows.find((x) => x.student_id === st.id && x.subject_id === sub.id && x.exam === e.code);
        marks[e.code] = r ? r.marks : null;
      }
      const rk = {};
      for (const e of exams) rk[e.code] = ranks[sub.id + ':' + e.code]?.get(st.id) ?? null;
      return { code: sub.code, gu: sub.name_gu, marks, ranks: rk, result: evaluate(std, marks) };
    });
    const passed = subjectsOut.filter((s) => s.result?.pass === true).length;
    const failed = subjectsOut.filter((s) => s.result?.pass === false).length;
    return {
      student_id: st.id, roll_no: st.roll_no, name_gu: st.name_gu,
      subjects: subjectsOut, passed, failed,
      // ધોરણ ૯ : પત્રે દેખાવેલા ગુણનો સરવાળો · ધોરણ ૧૦ : કુલ (ફક્ત ક્રમ માટે)
      displayTotal: std === 9
        ? subjectsOut.reduce((a, s) => a + (s.result?.finalMarks || 0), 0)
        : subjectsOut.reduce((a, s) => a + (s.result?.total || 0), 0),
      overallPass: failed === 0,
    };
  });

  const sorted = [...list].sort((a, b) => b.displayTotal - a.displayTotal);
  let rk = 0, prev = null;
  for (const s of sorted) {
    if (prev === null || s.displayTotal !== prev) { rk += 1; prev = s.displayTotal; }
    s.aggregateRank = s.displayTotal > 0 ? rk : null;
  }

  ok(res, { std, rule, exams, subjects, rows: list });
});

// ───────────────────────── guides ─────────────────────────
api.use('/teacher', teacher);

api.get('/guide', (_req, res) => ok(res, { guide: getMeta('guide', '') }));

export default api;
