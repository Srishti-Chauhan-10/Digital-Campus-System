// ─────────────────────────────────────────────────────────────
//  ગુણાકાર નિયમ — ઉત્તર બુનિયાદી આશ્રમ શાળા
//
//  ધોરણ ૯  : 50 + 50 + 80 + આંતરિક 20 = 200  →  પાસ 66  →  પત્રે /100
//  ધોરણ ૧૦ : 80 + 80  (કોઈ સંયુક્ત કુલ નહીં)
//             પ્રથમ : 26/80 પાસ · દ્વિતીય : 26/80 પાસ
//             આંતરિક 20 અલગ વિભાગમાં — કુલમાં ગણવામાં નહીં
//
//  રાન્ક : દરેક પરીક્ષાનો પોતાનો — કોઈ સંયુક્ત કુલનો રાન્ક નથી
// ─────────────────────────────────────────────────────────────

import { examsFor, RULE } from '../data/syllabus.js';

const examOf = (std, code) => examsFor(std).find((e) => e.code === code);

/**
 * એક જ વિષયના એક જ પરીક્ષાના વિદ્યાર્થીઓનો રાન્ક.
 * @param {Array<{id:number, marks:number|null}>} list
 * @returns {Map<number, number>} studentId -> rank (1 = highest)
 * સરખા ગુણ હોય તો બધાને એક જ રાન્ક; ગુણ ન લખાયું હોય તો રાન્ક નહીં.
 */
export function rankOf(list) {
  const scored = (list || [])
    .filter((r) => r.marks !== null && r.marks !== undefined && r.marks !== '')
    .map((r) => ({ id: r.id, marks: Number(r.marks) }))
    .filter((r) => !Number.isNaN(r.marks))
    .sort((a, b) => b.marks - a.marks);

  const out = new Map();
  let rank = 0;
  let prev = null;
  scored.forEach((r, i) => {
    if (prev === null || r.marks !== prev) {
      rank = i + 1;          // સરખા ગુણમાં બધાને એક જ રાન્ક
      prev = r.marks;
    }
    out.set(r.id, rank);
  });
  return out;
}

export const gradeOf = (p) =>
  p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'E';

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

/**
 * ધોરણ મુજબ એક વિદ્યાર્થી-વિષયનું પરિણામ બનાવે.
 * @param {number} std
 * @param {Object} marks  examCode -> marks  (ખાલું/નહીં એ ગણાતું નથી)
 */
export function evaluate(std, marks) {
  const rule = RULE[std];
  if (!rule) return null;

  const m = {};
  for (const c of [...rule.counted, rule.internalCode]) m[c] = num(marks[c]);

  // ── ધોરણ ૯ : 200 માંથી 66 પાસ, પત્રે /100 ──
  if (rule.combine === 'sum') {
    const counted = rule.internalCounts ? rule.counted : rule.mainCodes;
    const vals = counted.map((c) => m[c]).filter((v) => v !== null);

    if (!vals.length) {
      return { std, parts: [], perExam: {}, internal: m[rule.internalCode], total: null, outOf: rule.total,
        pass: null, finalMarks: null, finalOut: rule.outOf, failedIn: null, grade: '—' };
    }

    const total = vals.reduce((a, b) => a + b, 0);
    const pass = total >= rule.pass;
    const finalMarks = Math.round((total / rule.total) * rule.outOf * 100) / 100;
    const pct = (finalMarks / rule.outOf) * 100;

    // દરેક પરીક્ષો પોતાનું પાસ/નાપાસ જાણ કરે છે —
    // પણ આખરો નિર્ણય કુલ ૨૦૦ થી જ થાય છે.
    const perExam = {};
    for (const c of rule.mainCodes) {
      const need = rule.perExamPass[c];
      if (need === undefined) continue;
      const v = m[c];
      if (v === null) { perExam[c] = { marks: null, need, ok: null }; continue; }
      perExam[c] = { marks: v, need, ok: v >= need };
    }

    let failedIn = null;
    if (!pass) {
      for (const c of counted) {
        const need = rule.perExamPass[c];
        if (need !== undefined && m[c] !== null && m[c] < need) { failedIn = c; break; }
      }
      if (!failedIn) failedIn = 'TOTAL';
    }

    return {
      std,
      parts: counted.filter((c) => m[c] !== null).map((c) => ({
        code: c, marks: m[c], max: examOf(std, c)?.maxMarks ?? 0,
      })),
      perExam,
      internal: m[rule.internalCode],
      internalMax: examOf(std, rule.internalCode)?.maxMarks ?? 20,
      total, outOf: rule.total, pass, finalMarks, finalOut: rule.outOf,
      failedIn, grade: gradeOf(pct),
    };
  }

  // ── ધોરણ ૧૦ : દરેક પરીક્ષો છૂટ્ટો /80, 26 પાસ ──
  const checks = rule.mainCodes.map((c) => ({ code: c, v: m[c], need: rule.perExamPass[c] }));
  const entered = checks.filter((x) => x.v !== null);

  if (!entered.length) {
    return { std, parts: [], perExam: {}, internal: m[rule.internalCode], internalMax: 20,
      total: null, outOf: null, pass: null, finalMarks: null, finalOut: null,
      failedIn: null, grade: '—' };
  }

  const pass = entered.every((x) => x.v >= x.need);
  const bad = checks.find((x) => x.v !== null && x.v < x.need);

  const perExam = {};
  for (const x of checks) perExam[x.code] = { marks: x.v, need: x.need, ok: x.v === null ? null : x.v >= x.need };

  return {
    std,
    parts: checks.filter((x) => x.v !== null).map((x) => ({
      code: x.code, marks: x.v, max: examOf(std, x.code)?.maxMarks ?? 80, need: x.need,
    })),
    perExam,
    internal: m[rule.internalCode],
    internalMax: examOf(std, rule.internalCode)?.maxMarks ?? 20,
    total: entered.reduce((a, b) => a + b.v, 0),   // ફક્ત રાન્ક માટે — છપાવાતું નથી
    outOf: null, pass,
    finalMarks: null, finalOut: null,
    failedIn: pass ? null : (bad?.code || 'TOTAL'),
    grade: pass ? 'ઉત્તીર્ણ' : 'અનૌત્તીર્ણ',
  };
}
