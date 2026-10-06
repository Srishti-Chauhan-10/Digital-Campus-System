import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Field, Empty, Tabs } from '../../components/ui.jsx';
import { api } from '../../api.js';
import { examsFor } from '../../../../data/schoolMeta.js';

export default function TeacherMarks() {
  const { push } = useToast();
  const [std, setStd] = useState(9);
  const [exam, setExam] = useState('FIRST');
  const examDef = examsFor(std).find((e) => e.code === exam) || examsFor(std)[0];
  const [tick, setTick] = useState(0);
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});   // {student_id: {code: value}}
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState('entry');

  useEffect(() => {
    setData(null);
    api(`/teacher/marks/${std}/${exam}`).then((r) => {
      setData(r);
      const d = {};
      for (const row of r.rows) d[row.student_id] = { ...row.marks };
      setDraft(d);
      setDirty(false);
    }).catch((e) => push(e.message, 'error'));
  }, [std, exam, push, tick]);

  const setCell = (sid, code, v) => {
    setDraft((p) => ({ ...p, [sid]: { ...(p[sid] || {}), [code]: v } }));
    setDirty(true);
  };

  const save = async () => {
    const entries = (data.subjects || []).map((s) => ({
      code: s.code,
      rows: data.rows.map((r) => ({ student_id: r.student_id, marks: draft[r.student_id]?.[s.code] ?? '' })),
    }));
    try {
      const r = await api('/teacher/marks/save', { method: 'POST', body: { std, exam, entries } });
      push(`ગુણ સાચવાયા — ${r.saved} એન્ટ્રી${r.errors ? ` (${r.errors} ખોટી)` : ''}`);
      setDirty(false);
      setTick((t) => t + 1);
    } catch (e) { push(e.message, 'error'); }
  };

  const applyPaste = (text) => {
    const codes = (data.subjects || []).map((s) => s.code);
    const byRoll = Object.fromEntries(data.rows.map((r) => [r.roll_no, r.student_id]));
    let n = 0;
    for (const line of text.split(/\n+/)) {
      const l = line.trim();
      if (!l || l.startsWith('#')) continue;
      const parts = l.split(/[,;\t|]/).map((s) => s.trim());
      const roll = parseInt(parts[0], 10);
      if (!roll || !byRoll[roll]) continue;
      codes.forEach((c, i) => {
        const v = parts[i + 1];
        if (v !== undefined && v !== '') { setCell(byRoll[roll], c, v); n++; }
      });
    }
    push(`${n} ગુણ ભરાયા — હવે “સાચવો” દબાવો.`);
  };

  if (!data) return <Layout role="teacher"><p className="muted">લોડ થાય છે…</p></Layout>;

  return (
    <Layout role="teacher">
      <header className="mb-5">
        <h1 className="h-title">📊 ગુણ અપલોડ</h1>
        <p className="muted mt-1">રોલ નંબર પ્રમાણે ગુણ ભરો — એક જ વાર ડેટા દાખલ કરો, પછી વિદ્યાર્થીના પરિણામ તરત દેખાશે.</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={std} onChange={(e) => setStd(Number(e.target.value))}>
          <option value={9}>ધોરણ ૯</option>
          <option value={10}>ધોરણ ૧૦</option>
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-brand-100/70 p-1.5">
            {examsFor(std).filter((e) => !e.internal).map((e) => (
              <button key={e.code} onClick={() => setExam(e.code)}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition
                  ${exam === e.code ? 'bg-white text-brand-900 shadow-sm'
                    : 'text-brand-700 hover:bg-white/60'}`}>
                {e.gu} <span className="opacity-70">/{e.max}</span>
                <span className="ml-1 text-[10px] font-bold text-gold-700">પાસ {e.pass}</span>
              </button>
            ))}
          </div>
          {/* ── આંતરિક ગુણ — અલગ વિભાગ ── */}
          {(() => {
            const it = examsFor(std).find((e) => e.internal);
            if (!it) return null;
            return (
              <button onClick={() => setExam(it.code)}
                className={`flex items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-2 transition
                  ${exam === it.code
                    ? 'border-gold-500 bg-gold-100 text-brand-900'
                    : 'border-gold-400/70 bg-gold-50 text-gold-800 hover:bg-gold-100'}`}>
                <span className="text-base">📝</span>
                <span className="text-left leading-tight">
                  <span className="block text-xs font-extrabold">આંતરિક ગુણ વિભાગ</span>
                  <span className="block text-[10px] font-bold opacity-80">અલગ · પૂરા {it.max} ગુણ</span>
                </span>
              </button>
            );
          })()}
        </div>
        <div className="min-w-[220px]">
          <Tabs value={view} onChange={setView} tabs={[{ value: 'entry', label: '✍️ ગુણ ભરો' }, { value: 'sheet', label: '📄 પરિણામ પત્ર' }]} />
        </div>
        {view === 'entry' && (
          <button className="btn-primary ml-auto" disabled={!dirty} onClick={save}>
            {dirty ? '💾 સાચવો' : '✓ સચવેલું'}
          </button>
        )}
      </div>

      {view === 'entry' && data.isInternal && (
        <div className="mb-4 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 px-4 py-3">
          <p className="text-sm font-extrabold text-brand-900">📝 આંતરિક ગુણ વિભાગ ({data.examName})</p>
          <p className="mt-0.5 text-xs font-semibold text-gold-800">
            {std === 9
              ? 'આ આંતરિક ગુણ વિષયદીઠ કુલ ૨૦૦ માં ગણાય છે.'
              : 'આ આંતરિક ગુણ અલગ છે — ધોરણ ૧૦ ના કુલમાં ગણાતું નથી.'}
            {' '}દરેક વિષયના આંતરિક ગુણ અહીં નાખો.
          </p>
        </div>
      )}

      {view === 'entry' ? (
        data.rows.length === 0 || data.subjects.length === 0 ? (
          <div className="card"><Empty icon="👥" title="માટું નથી" hint="પહેલાં વિદ્યાર્થી યાદીમાં નામ અને રોલ નંબર નોંધો." /></div>
        ) : (
          <MarksTable data={data} draft={draft} onChange={setCell} onPaste={applyPaste}
            maxMarks={examDef.max} passMarks={examDef.pass} />
        )
      ) : (
        <ResultSheet std={std} exam={exam} tick={tick} />
      )}
    </Layout>
  );
}

function MarksTable({ data, draft, onChange, onPaste, maxMarks, passMarks }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 px-4 py-3">
          <p className="text-xs font-bold text-brand-700">
            {data.examName} · ધોરણ {data.std} · {data.rows.length} વિદ્યાર્થી
            {data.examMax ? <> · પૂરા ગુણ <b className="text-brand-900">{data.examMax}</b></> : null}
            {data.examPass ? <> · પાસ ગુણ <b className="text-brand-900">{data.examPass}</b></> : null}
          </p>
          <button className="btn-soft" onClick={() => setPasteOpen(true)}>📋 જલદી નિવાડી</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50/70">
                <th className="sticky left-0 z-10 bg-brand-50 px-3 py-2.5 text-left font-extrabold text-brand-800">રોલ</th>
                <th className="sticky left-[52px] z-10 min-w-[150px] bg-brand-50 px-3 py-2.5 text-left font-extrabold text-brand-800">નામ</th>
                {data.subjects.map((s) => (
                  <th key={s.code} className="px-2 py-2.5 text-center font-extrabold text-brand-800" title={s.gu}>
                    <span className="block text-[10px] uppercase tracking-wide text-brand-700/70">{s.code}</span>
                    <span className="text-xs">{s.gu}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {data.rows.map((r) => (
                <tr key={r.student_id} className="hover:bg-brand-50/40">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-extrabold text-brand-800">{r.roll_no}</td>
                  <td className="sticky left-[52px] z-10 bg-white px-3 py-1.5 font-semibold text-brand-900">{r.name_gu}</td>
                  {data.subjects.map((s) => {
                    const v = draft[r.student_id]?.[s.code] ?? '';
                    const nv = Number(v);
                    const belowPass = passMarks && v !== '' && !Number.isNaN(nv) && nv < passMarks;
                    return (
                      <td key={s.code} className="px-1.5 py-1.5">
                        <input
                          className={`w-[62px] rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-bold
                                     outline-none focus:ring-2 ${belowPass
                                       ? 'border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-200'
                                       : 'border-brand-200 text-brand-900 focus:border-brand-500 focus:ring-brand-200'}`}
                          inputMode="decimal"
                          max={maxMarks}
                          value={v}
                          onChange={(e) => onChange(r.student_id, s.code, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-brand-100 px-4 py-3 text-[11px] font-semibold text-brand-700/70">
          ખાલી ખોલી રાખો તો તે વિષયનો ગુણ રહી જશે (એટલે “ના માર્ક્સ”).
          {maxMarks ? <> દરેક ખાનેમાં વધુમાં વધુ <b>{maxMarks}</b> લખી શકાશો.</> : null}
          {passMarks ? <> પાસ ગુણ <b>{passMarks}</b> થી ઓછું લખાય તો ઘરેટું દેખાશે.</> : null}
        </p>
      </div>

      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setPasteOpen(false)} />
          <div className="animate-pop relative w-full max-w-2xl rounded-3xl bg-cream p-5 shadow-lift">
            <h3 className="h-sub mb-1">જલદી નિવાડી (paste)</h3>
            <p className="muted mb-3">
              દરેક લાઇનમાં : <code className="rounded bg-brand-100 px-1.5 py-0.5 font-bold">રોલનંબર, ગુણ૧, ગુણ૨, …</code> — કૉલમનો ક્રમ ઉપરની તાલિકાનો હોવો જોઈએ.
            </p>
            <pre className="rounded-2xl bg-brand-100 p-3 text-[11px] font-bold text-brand-800">
{`10, 45, 52, 38
11, 51, 47, 40
12, 39, 60, 44`}
            </pre>
            <textarea className="input mt-3 min-h-[140px] font-mono text-sm" value={text}
              onChange={(e) => setText(e.target.value)} placeholder="અહીં ચોંટાણી કરો…" />
            <div className="mt-3 flex gap-2">
              <button className="btn-primary flex-1" onClick={() => { onPaste(text); setPasteOpen(false); setText(''); }}>ભરો</button>
              <button className="btn-ghost" onClick={() => setPasteOpen(false)}>રદ</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultSheet({ std, exam, tick = 0 }) {
  const { push } = useToast();
  const [data, setData] = useState(null);
  useEffect(() => {
    api(`/teacher/result-sheet/${std}/${exam}`).then(setData).catch((e) => push(e.message, 'error'));
  }, [std, exam, push, tick]);
  if (!data) return <p className="muted">લોડ થાય છે…</p>;

  const maxOne = data.examMax || 0;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-100 px-5 py-4">
        <h2 className="h-sub">{data.examName} — ધોરણ {std} પરિણામ પત્ર</h2>
        <p className="mt-1 text-xs font-semibold text-brand-700">
          દરેક વિષય {maxOne ? `/ ${maxOne}` : ''}
          {data.examPass ? ` · પાસ ગુણ ${data.examPass}` : ''}
          {data.isInternal ? ' · આંતરિક ગણતરી' : ''}
          {' · કોલમમાં ગુણ ઉપર નીચે Rank'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-50/70">
              <th className="px-3 py-2.5 text-left font-extrabold text-brand-800">રોલ</th>
              <th className="px-3 py-2.5 text-left font-extrabold text-brand-800">નામ</th>
              {data.subjects.map((s) => <th key={s.id} className="px-2 py-2.5 text-center font-extrabold text-brand-800">{s.code}</th>)}
              {data.exam === 'ANNUAL' && (<th className="px-3 py-2.5 text-center font-extrabold text-brand-800">કુલ</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {data.rows.map((r) => {
              const fails = data.examPass
                ? data.subjects.filter((s) => {
                    const m = r.marks[s.code];
                    return m !== null && m !== undefined && m !== '' && Number(m) < data.examPass;
                  }).length
                : 0;
              return (
                <tr key={r.roll_no} className="hover:bg-brand-50/40">
                  <td className="px-3 py-2 font-extrabold text-brand-800">{r.roll_no}</td>
                  <td className="px-3 py-2 font-semibold text-brand-900">
                    {r.name_gu}
                    {fails > 0 && (
                      <span className="ml-1.5 chip bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">
                        ✗ {fails}
                      </span>
                    )}
                  </td>
                  {data.subjects.map((s) => {
                    const m = r.marks[s.code];
                    const has = m !== null && m !== undefined && m !== '';
                    const bad = data.examPass && has && Number(m) < data.examPass;
                    return (
                      <td key={s.id} className="px-2 py-2 text-center">
                        <span className={`font-semibold ${bad ? 'text-rose-600' : 'text-brand-800'}`}>
                          {has ? m : '—'}
                        </span>
                        {r.rank?.[s.code] ? (
                          <span className="mt-0.5 block text-[10px] font-bold text-gold-700">
                            #{r.rank[s.code]}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  {data.exam === 'ANNUAL' && (
                    <td className="px-3 py-2 text-center font-extrabold text-brand-900">{r.examTotal}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-brand-100 px-5 py-3 text-[11px] font-semibold text-brand-700/70">
        Rank દરેક પરીક્ષાનો પોતાનો છે — કોઈ સંયુક્ત કુલનો Rank નથી.
        {data.examPass ? ` પાસ ગુણ ${data.examPass} થી ઓછું લખાય તો ✓ નહીં ✗ દેખાશે.` : ''}
      </p>
    </div>
  );
}
