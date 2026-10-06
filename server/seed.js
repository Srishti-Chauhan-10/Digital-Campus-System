import { db } from './db.js';
import { SYLLABUS, STAFF, EXAMS, STUDENT_PASSWORDS, DEFAULT_TEACHER_PASSWORD, SCHOOL } from './data/syllabus.js';

// શિક્ષક માટે ડેટા નાખવાની ગાઈડ (વેબ અને SQL બંને રીત)
const DATA_GUIDE = `ઉત્તર બુનિયાદી આશ્રમ શાળા — ડેટા નાખવાની સંપૂર્ણ માર્ગદર્શિકા

શિક્ષક લોગઇન : મોબાઇલ નંબર + પાસવર્ડ (ડિફૉલ્ટ : teacher)

૧. વિદ્યાર્થી ઉમેરવો
   • શિક્ષક યાદી પૃષ્ઠ પર ધોરણ પસંદ કરો → "નવો વિદ્યાર્થી" → રોલ નંબર અને ગુજરાતી નામ ભરો → ઉમેરો.
   • એકસાથે ઘણા વિદ્યાર્થી : "બલ્ક ઉમેરો" ખોલીને દરેક લાઇનમાં "રોલ,નામ" લખો.
     ઉદાહરણ :
       1,હિશ્રીષ્ટી પટેલ
       2,રાહુલ ચૌધરી
   • વિદ્યાર્થી કાઢવો હોય તો યાદીમાં તેની સામે કાઢી નિશાની દબાવો.

૨. પ્રકરણ (અભ્યાસક્રમ) ઉમેરવો
   • શિક્ષક અભ્યાસક્રમ પૃષ્ઠ પર ધોરણ → વિષય પસંદ → વિષય ખોલો → "નવો પ્રકરણ".
   • ઘણા પ્રકરણ એકસાથે : "બલ્ક પ્રકરણ" માં દરેક લાઇનમાં "પ્રકરણ નંબર,નામ,મહિનો" લખો.
   • કાઢી નાખવા હોય તો પ્રકરણ પાસે કાઢી નિશાની.

૩. ગુણ નાખવા
   • શિક્ષક "ગુણ નોંધણી" પૃષ્ઠ પર જાઓ → ધોરણ અને પરીક્ષા પસંદ કરો.
   • એક વિદ્યાર્થીના બધા વિષયના ગુણ સીધા કોષમાં લખો (એક વાર લખ્યા પછી સીધું "સાચવો" બટન).
   • ઘણા વિદ્યાર્થીના ગુણ જોઈતા હોય તો "બલ્ક ચોંટાડો" વાપરો : વિદ્યાર્થી-વિદ્યાર્થી કોષ કે જેમ કે તેમ ચોંટાડો, વિષય-વિષય ગુણ છાજમાં ચોંટાડો.
   • વિદ્યાર્થીએ એક વાર ગુણ સાચવ્યા પછી હવે તમે ફક્ત "ફક્ત અપલોડ" કરો છતાં વિદ્યાર્થી તરત જ પરિણામ જુએ.

૪. વિદ્યાર્થી પાસવર્ડ
   • ધોરણ ૯ વિદ્યાર્થી : student9
   • ધોરણ ૧૦ વિદ્યાર્થી : student10
   • વિદ્યાર્થી રોલ નંબર અને પાસવર્ડ વડે લોગઇન કરે છે.

૫. શિક્ષક લોગઇન (મોબાઇલ નંબર વડે)
   • 9427518906 - સમીર સાહેબ (ગણિત)
   • 6352866818 - સંગીતા મેડમ
   • 9428687041 - વિનય સાહેબ
   • બધા શિક્ષકનો પાસવર્ડ : teacher

૬. જો વેબ પર કંઈ કામ ન આવે તો સીધા ડેટાબેઝમાં લખો
   ફાઇલ : data/school.db    ટેબલ : students
   SQL : INSERT INTO students (std, roll_no, name_gu) VALUES (9, 51, 'નવો વિદ્યાર્થી');
   પછી સર્વર ફરી ચાલુ કરો.`;

// ── વિદ્યાર્થી યાદી (નામ | english) ──────────────────────────
const STD9_NAMES = [
  'આરવ પટેલ', 'વિહાન ચૌધરી', 'આરવ પરમાર', 'દરશ ગાંઠિયા', 'યશ ભટ્ટ',
  'કિરણ સોલંકી', 'હેતલ વાઘેલા', 'એકલ જાડેજી', 'દર્શ મકવાણા', 'રિયાન્ક દલાલ',
  'મયંક રાઠોડ', 'આરવ ગાંધી', 'વિશ્વ કોટકી', 'નિકુંજ બારોટ', 'જય ઉપાધ્યાય',
  'નિખિલ દોશી', 'ધીરજ વાઘ', 'પ્રશાંત જાડેજી', 'રોહિત ચૌહાણ', 'અજય મકવાણા',
  'કાંત ઠકકર', 'સંકેત ગજેરા', 'યુવરાજ સાદલે', 'મનન ભટ્ટ', 'ભાવેશ પંડિતા',
  'તેજસ ખોડા', 'કિશન ચરિત્ર', 'નિરવ પટેલ', 'અંકિત પરમાર', 'જિગ્નેશ વસાવડા',
  'હિતેષ મોદી', 'પ્રવીણ રાઠોડ', 'અમિત જાની', 'સંજય ડાંગર', 'વિશાલ ઓઝા',
  'કાર્તિક શાહ', 'રાહુલ મિસ્ત્રી', 'શ્યામ અનેરિયા', 'ધ્વનિ રાઠોડ', 'હિતેલ ભટ્ટ',
  'જીવન ગાંધી', 'આરવિંદ કોટકી', 'મયંક પંડિતા', 'ઉત્કર્ષ દોશી',
  // ૪૬ થી ૮૦ — વધારાના વિદ્યાર્થીઓ
  'વિશાલ મકવાણા', 'દીપ રાઠોડ', 'કાયા ગાંઠિયા', 'નિકુંજ ચૌધરી', 'સોનલ પટેલ',
  'રીયા ખોડા', 'અર્પિત સોલંકી', 'નમ્રતા દલાલ', 'યુવરાજ ભટ્ટ', 'મનીષા ગાંધી',
  'હિતેલ પરમાર', 'જિગ્નેશ જાડેજી', 'પ્રકાશ વાઘેલા', 'રેખા મકવાણા', 'દીપક ગાંઠિયા',
  'તેજસ પંડિતા', 'સોહન મોદી', 'કૃણાલ રાઠોડ', 'શિવાની પટેલ', 'અંકિત ગાંધી',
  'વિરલ ચૌહાણ', 'મૂત્ષ ભટ્ટ', 'અમિશ દોશી', 'હિમાંશુ જાની', 'કૃષ્ણા વસાવડા',
  'રાહુલ ઠકકર', 'નિશા ગજેરા', 'પરેશ કોટકી', 'મીતા ચરિત્ર', 'સુનીલ અનેરિયા',
  'કેતકી ખોડા', 'ભાવેશ ગાંઠિયા', 'આકાશ મિસ્ત્રી', 'જયદીપ શાહ', 'ધ્વનિ જાની', 'મોના પંડિતા',
];

const STD10_NAMES = [
  'દર્શ પટેલ', 'રીયા ગાંધી', 'અર્પિત ચૌધરી', 'નિખિલ ભટ્ટ', 'કૃણાલ ગાંઠિયા',
  'જાગીર પરમાર', 'ધ્વનિ વાઘેલા', 'મીરા દલાલ', 'હેતલ ખોડા', 'શ્યામ સોલંકી',
  'કિરણ જાડેજી', 'મુકેશ મકવાણા', 'પૂજા રાઠોડ', 'અજય ગાંધી', 'સિમરન ભટ્ટ',
  'રાણા કોટકી', 'વિશાલ ભટ્ટ', 'નમ્રતા ચૌધરી', 'યુવરાજ દલાલ', 'કેતકી જાડેજી',
  'પ્રણવ પટેલ', 'આશિષા વાઘેલા', 'મિહિર પરમાર', 'રોહિત ખોડા', 'મોના ગાંઠિયા',
  'કિશન ગાંધી', 'જિગ્નેશ મકવાણા', 'આરતી સોલંકી', 'નિરવ ભટ્ટ', 'સુનીલ રાઠોડ',
  'દીપ ગજેરા', 'પાર્થ ઠકકર', 'શ્વેતા પટેલ', 'હિતેષ ગાંધી', 'કિશોર ચરિત્ર',
  'અનિલ મોદી', 'રેખા વસાવડા', 'સુરેશ ડાંગર', 'હિમાંશુ પંડિતા', 'રોહિની ખોડા',
  'પ્રકાશ જાની', 'ટીના ગાંધી', 'યોગેશ વાઘ', 'મનીષા દલાલ', 'દીપક કોટકી',
  'ચેતન ભટ્ટ',
  // ૪૭ થી ૮૦ — વધારાના વિદ્યાર્થીઓ
  'પારુલ મકવાણા', 'કાયા ખોડા', 'નેહા ગાંધી', 'યોગેશ ચૌધરી', 'રિયા જાડેજી',
  'મનન પટેલ', 'સિમરન રાઠોડ', 'આશિષા દલાલ', 'મિહિર ગાંઠિયા', 'રોહિત સોલંકી',
  'પૂજા ખોડા', 'અજય પરમાર', 'સ્નેહા વાઘેલા', 'કિરણ ભટ્ટ', 'વિશાલ મિસ્ત્રી',
  'ભાવના શાહ', 'ઉત્કર્ષ ડાંગર', 'દીપાંશુ વસાવડા', 'મનીષા કોટકી', 'હિતેષ મકવાણા',
  'અનિલ દોશી', 'ટીના ચૌહાણ', 'સુરેશ ગાંધી', 'પરિશ પંડિતા', 'રોહિની રાઠોડ',
  'પ્રણવ સોલંકી', 'જ્યોતિ ગજેરા', 'અક્ષય ઠકકર', 'નેમા પટેલ', 'વિજય અનેરિયા',
  'કૃષ્ણા ભટ્ટ', 'ઓમ મોદી', 'કિશોર ગાંઠિયા', 'અંશુલેખ પટેલ',
];

// Roll No. 10 of std 10 must be હિશ્રીષ્ટી (as described by the school)
STD10_NAMES[9] = 'હિશ્રીષ્ટી';
STD9_NAMES[9] = 'રિયાન્ક દલાલ';

const HELPLINES = [
  ['112', 'એક સંકેત ઇમર્જન્સી', 'ગમયાન દરમિયાન કોઈપણ ઈમર્જન્સી માટે', 'emergency', 1],
  ['100', 'પોલીસ', 'દરરોજની ગુંડાગીરી, ચોરી, દેખરેખ', 'police', 2],
  ['108', 'એમ્બ્યુલન્સ', 'તાત્કાલિક મેડિકલ સહાય', 'medical', 3],
  ['101', 'અગ્નિમંત્ર', 'આગ લાગવાના તબંગને', 'fire', 4],
  ['104', 'મેડિકલ એમર્જન્સી', 'તબંગ કારણે મારકાયેલ વ્યક્તિને', 'medical', 5],
  ['1098', 'બાળ હેલ્પલાઇન (Childline)', 'બાળકો પર અત્યાચાર, કામ પર જાતા, ખોટી સમજોટ', 'child', 6],
  ['181', 'મહિલા હેલ્પલાઇન', 'છેલલી વિનંતી પર તરત સહાય (24x7)', 'women', 7],
  ['14567', 'મહિલા હેલ્પલાઇન (NALSA)', 'કાનૂની સહાય અને અભિવાદન', 'women', 8],
  ['1930', 'સાયબર ક્રાઇમ હેલ્પલાઇન', 'ઓનલાઈન છેતરવાણી, ફ્રેડ, સ્પૅમ', 'cyber', 9],
  ['9427518906', 'સમીર સાહેબ (શિક્ષક)', 'શાળાની મૂલ ભાવના : અભ્યાસ, શંકા, તકાલીની વાત', 'school', 10],
  ['6352866818', 'સંગીતા મેડમ (શિક્ષિકા)', 'વિજ્ઞાન અને શાળાની વ્યવસ્થા માટે સંપર્ક', 'school', 11],
  ['9428687041', 'વિનય સાહેબ (શિક્ષક)', 'સામાજિક વિજ્ઞાન અને શાળાની વ્યવસ્થા માટે સંપર્ક', 'school', 12],
];

const toEnglish = (gu) => {
  const map = {
    'આરવ': 'Arav', 'વિહાન': 'Vihan', 'દરશ': 'Darsh', 'યશ': 'Yash', 'કિરણ': 'Kiran',
    'હેતલ': 'Hetal', 'એકલ': 'Akel', 'રિયાન્ક': 'Riyank', 'મયંક': 'Mayank', 'નિખિલ': 'Nikhil',
    'જય': 'Jay', 'ધીરજ': 'Dhiraj', 'પ્રશાંત': 'Prashant', 'રોહિત': 'Rohit', 'અજય': 'Ajay',
    'કાંત': 'Kant', 'યુવરાજ': 'Yuvraj', 'તેજસ': 'Tejas', 'નિરવ': 'Nirav', 'અંકિત': 'Ankit',
    'જિગ્નેશ': 'Jignesh', 'હિતેષ': 'Hitesh', 'અમિત': 'Amit', 'સંજય': 'Sanjay', 'કાર્તિક': 'Kartik',
    'શ્યામ': 'Shyam', 'જીવન': 'Jivan', 'આરવિંદ': 'Aravind', 'ઉત્કર્ષ': 'Utkarsh', 'રીયા': 'Riya',
    'અર્પિત': 'Arpit', 'કૃણાલ': 'Krunal', 'જાગીર': 'Jagir', 'મીરા': 'Meera', 'શ્યામ': 'Shyam',
    'પૂજા': 'Puja', 'સિમરન': 'Simran', 'રાણા': 'Rana', 'વિશાલ': 'Vishal', 'નમ્રતા': 'Namrata',
    'પ્રણવ': 'Pranav', 'આશિષા': 'Ashisha', 'મિહિર': 'Mihir', 'કિશન': 'Kishan', 'આરતી': 'Aarti',
    'દીપ': 'Deep', 'પાર્થ': 'Parth', 'શ્વેતા': 'Shweta', 'અનિલ': 'Anil', 'રેખા': 'Rekha',
    'સુરેશ': 'Suresh', 'હિમાંશુ': 'Himanshu', 'રોહિની': 'Rohini', 'પ્રકાશ': 'Prakash', 'ટીના': 'Tina',
    'યોગેશ': 'Yogesh', 'મનીષા': 'Manisha', 'દીપક': 'Deepak', 'ચેતન': 'Chetan', 'હિશ્રીષ્ટી': 'Hishrishti',
  };
  const parts = gu.trim().split(/\s+/);
  return parts.map((p) => map[p] || p).join(' ');
};

function randomMarks() {
  return Math.round(25 + Math.random() * 45); // 25 – 69
}

export function seed({ silent = false } = {}) {
  const log = (...a) => { if (!silent) console.log(...a); };

  db.transaction(() => {
    // subjects + chapters
    const insSubject = db.prepare(
      'INSERT INTO subjects (std, code, name_gu, name_en, max_marks) VALUES (?,?,?,?,?) ' +
      'ON CONFLICT(std,code) DO UPDATE SET name_gu=excluded.name_gu, name_en=excluded.name_en'
    );
    const insChapter = db.prepare(
      'INSERT INTO chapters (subject_id, no, name, month, source) VALUES (?,?,?,?,?) ' +
      'ON CONFLICT(subject_id,no) DO NOTHING'
    );
    for (const std of [9, 10]) {
      for (const s of SYLLABUS[std]) {
        insSubject.run(std, s.code, s.gu, s.en, s.maxMarks || 100);
        const row = db.prepare('SELECT id FROM subjects WHERE std=? AND code=?').get(std, s.code);
        for (const c of s.chapters) insChapter.run(row.id, c.no, c.name, c.month, c.source);
      }
    }
    log('✓ વિષયો અને અભ્યાસક્રમ ચ્પ્રમણ કર્યા');

    // teachers
    const insTeacher = db.prepare(
      'INSERT INTO teachers (phone, name_gu, name_en, role, subject, password) VALUES (?,?,?,?,?,?) ' +
      'ON CONFLICT(phone) DO UPDATE SET name_gu=excluded.name_gu, name_en=excluded.name_en'
    );
    for (const t of STAFF) insTeacher.run(t.phone, t.nameGu, t.nameEn, t.role, t.subject, DEFAULT_TEACHER_PASSWORD);
    log('✓ શિક્ષક નોંધણી કરી');

    // students
    const insStudent = db.prepare(
      'INSERT INTO students (std, roll_no, name_gu, name_en, gender, hostel) VALUES (?,?,?,?,?,?) ' +
      'ON CONFLICT(std, roll_no) DO NOTHING'
    );
    let added = 0;
    for (const [std, names] of [[9, STD9_NAMES], [10, STD10_NAMES]]) {
      names.forEach((nm, i) => {
        const roll = i + 1;
        const info = insStudent.run(std, roll, nm, toEnglish(nm), 'M', roll % 3 === 0 ? 'હા' : 'ના');
        added += info.changes;
      });
    }
    log(`✓ વિદ્યાર્થીઓ ઉમેર્યા (${added} નવા)`);

    // demo marks so results section is not empty
    const insResult = db.prepare(
      'INSERT INTO results (student_id, subject_id, exam, marks, max_marks) VALUES (?,?,?,?,?) ' +
      'ON CONFLICT(student_id, subject_id, exam) DO NOTHING'
    );
    let marks = 0;
    for (const std of [9, 10]) {
      const subjects = db.prepare('SELECT id FROM subjects WHERE std=?').all(std);
      const students = db.prepare('SELECT id FROM students WHERE std=?').all(std);
      for (const s of students) {
        for (const subj of subjects) {
          for (const ex of EXAMS) {
            if (Math.random() < 0.75) { insResult.run(s.id, subj.id, ex.code, randomMarks(), ex.maxMarks); marks++; }
          }
        }
      }
    }
    log(`✓ પરીક્ષા પરિણામ જનરેટ કર્યા (${marks})`);

    // helplines
    const insHelp = db.prepare(
      'INSERT INTO helplines (number, name_gu, note_gu, category, sort) VALUES (?,?,?,?,?)'
    );
    if (db.prepare('SELECT COUNT(*) c FROM helplines').get().c === 0) {
      for (const h of HELPLINES) insHelp.run(...h);
      log('✓ હેલ્પલાઇન નંબરો ઉમેર્યા');
    }

    db.prepare('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)').run('school', JSON.stringify(SCHOOL));
    db.prepare('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)').run('studentPasswords', JSON.stringify(STUDENT_PASSWORDS));
    db.prepare('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)').run('guide', DATA_GUIDE);
  })();

  return db;
}

export default seed;
