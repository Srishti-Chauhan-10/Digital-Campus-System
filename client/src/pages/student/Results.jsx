import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast, Tabs, Empty, Stat } from '../../components/ui.jsx';
import { api } from '../../api.js';

const EXAM_HINT = {
  FIRST: 'પ્રથમ',
  SECOND: 'દ્વિતીય',
  ANNUAL: 'વાર્ષિક',
  INTERNAL: 'આંતરિક',
};

// ── મુખ્ય પાન ──────────────────────────────────────────────
export default function Results() {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('FIRST');

  useEffect(() => {
    setData(null);
    api('/student/results').then(setData).catch((e) => push(e.message, 'error'));
  }, [push]);

  if (!data) {
    return <Layout role="student"><div className="card card-pad"><p className="muted">લોડ થાય છે…</p></div></Layout>;
  }

  const { student, rule, exams, subjects } = data;
  const isStd9 = Number(rule?.combine) === undefined ? Number(student.std) === 9 : rule.combine === 'sum';
  const tabs = exams.map((e) => ({
    value: e.code,
    label: e.internal
      ? `📝 આંતરિક /${e.maxMarks}`
      : `${EXAM_HINT[e.code] || e.gu} /${e.maxMarks}`,
  }));

  const active = exams.find((e) => e.code === tab) || exams[0];

  return (
    <Layout role="student">
      {/* ── શીર્ષક ── */}
      <header className="mb-5">
        <h1 className="h-title">📊 પરિણામ પત્ર</h1>
        <p className="muted mt-1">
          {student.name_gu} · ધોરણ {student.std} · રોલ નં. {student.roll_no}
        </p>
      </header>

      {/* ── નિયમ સમજાવવો ── */}
      <RuleBanner rule={rule} std={student.std} />

      {/* ── પરીક્ષા ટેબ ── */}
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={tabs} />
      </div>

      {subjects.length === 0 ? (
        <div className="card"><Empty icon="📚" title="કોઈ વિષય નથી" hint="શિક્ષકે હજુ ગુણ નાખ્યા નથી." /></div>
      ) : (
        <ExamPanel subjects={subjects} active={active} isStd9={isStd9} std={Number(student.std)} />
      )}
    </Layout>
  );
}

// ── નિયમ બેનર ────────────────────────────────────────────
function RuleBanner({ rule, std }) {
  if (!rule) return null;
  if (std === 9) {
    return (
      <div className="card card-pad mb-4 border-l-4 border-l-brand-500 bg-brand-50/60">
        <p className="text-sm font-extrabold text-brand-900">વિષયદીઠ નિયમ</p>
        <p className="mt-1 text-sm text-brand-800">
          પ્રથમ ૫૦ + દ્વિતીય ૫૦ + વાર્ષિક ૮૦ + આંતરિક ૨૦ = <b>કુલ ૨૦૦</b> · પાસ ગુણ <b>૬૬</b>
        </p>
        <p className="mt-1 text-xs font-semibold text-brand-700">
          પત્રે ગુણ કુલ ૨૦૦ ને ૧૦૦ ઉપર ગણતરી કરીને દેખાવાય છે (અડધા) · ઉદાહરણ : ૬૬/૨૦૦ = <b>૩૩/૧૦૦</b>
        </p>
      </div>
    );
  }
  return (
    <div className="card card-pad mb-4 border-l-4 border-l-brand-500 bg-brand-50/60">
      <p className="text-sm font-extrabold text-brand-900">નિયમ</p>
      <p className="mt-1 text-sm text-brand-800">
        પ્રથમ પરીક્ષા <b>/૮૦</b> (પાસ ૨૬) · દ્વિતીય પરીક્ષા <b>/૮૦</b> (પાસ ૨૬)
      </p>
      <p className="mt-1 text-xs font-semibold text-brand-700">
        આંતરિક ગુણ <b>/૨૦</b> અલગ વિભાગમાં છે — કુલમાં ગણાતું નથી. દરેક પરીક્ષો અલગથી પાસ થવું પડશે.
      </p>
    </div>
  );
}

// ── એક પરીક્ષાનો પાન ──────────────────────────────────────
function ExamPanel({ subjects, active, isStd9, std }) {
  const isInternal = !!active?.internal;

  // આ પરીક્ષાનો વર્ગ Rank (વિષયદીઠ)
  const ranks = useMemo(
    () => subjects.map((s) => ({ name: s.subject, rank: s.ranks?.[active.code] ?? null, marks: s.marks?.[active.code] })),
    [subjects, active]
  );
  const ranked = ranks.filter((r) => r.rank);
  const withMarks = ranks.filter((r) => r.marks !== null && r.marks !== undefined && r.marks !== '');

  return (
    <div className="space-y-4">
      {/* ── આંતરિક = અલગ વિભાગ ── */}
      {active?.internal && (
        <div className="mb-4 rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 px-4 py-3">
          <p className="text-sm font-extrabold text-brand-900">📝 આંતરિક ગુણ વિભાગ</p>
          <p className="mt-0.5 text-xs font-semibold text-gold-800">
            {std === 9
              ? <>આ ગુણ વિષયદીઠ કુલ <b>૨૦૦</b> માં ગણાય છે (૫૦ + ૫૦ + ૮૦ + ૨૦).</>
              : <>આ ગુણ <b>અલગ વિભાગમાં</b> છે — ધોરણ ૧૦ ના કુલમાં ગણાતું નથી.</>}
          </p>
        </div>
      )}

      {/* પરીક્ષાનું શીર્ષક */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="h-sub">{active?.gu}</h2>
            <p className="mt-0.5 text-xs font-semibold text-brand-700">
              પૂરા ગુણ {active?.maxMarks}
              {active?.pass ? ` · પાસ ગુણ ${active.pass}` : ' · આંતરિક ગણતરી'}
            </p>
          </div>
          {ranked.length > 0 && (
            <div className="text-right">
              <p className="text-xs font-bold text-brand-700">સર્વચ્છ ગુણ</p>
              <p className="text-2xl font-extrabold text-brand-900">
                {Math.max(...withMarks.map((r) => Number(r.marks)))}
                <span className="text-base text-brand-700/70"> /{active.maxMarks}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* વિષયવાર ગુણ + Rank */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50/70">
                <th className="px-4 py-2.5 text-left font-extrabold text-brand-800">વિષય</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-brand-800">ગુણ</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-brand-800">Rank</th>
                {active?.pass != null && (
                  <th className="px-3 py-2.5 text-center font-extrabold text-brand-800">પાસ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {subjects.map((s) => {
                const m = s.marks?.[active.code];
                const has = m !== null && m !== undefined && m !== '';
                const rk = s.ranks?.[active.code] ?? null;
                const need = active?.pass;
                const below = need != null && has && Number(m) < need;
                return (
                  <tr key={s.code} className="hover:bg-brand-50/40">
                    <td className="px-4 py-2.5 font-semibold text-brand-900">{s.subject}</td>
                    <td className="px-3 py-2.5 text-center">
                      {has ? (
                        <span className={`font-extrabold ${below ? 'text-rose-600' : 'text-brand-900'}`}>
                          {m}<span className="text-xs font-semibold text-brand-700/60">/{active.maxMarks}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-brand-700/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {rk ? (
                        <span className="chip bg-gold-200 text-brand-900">#{rk}</span>
                      ) : (
                        <span className="text-xs text-brand-700/50">—</span>
                      )}
                    </td>
                    {!isStd9 && need != null && (
                      <td className="px-3 py-2.5 text-center">
                        {!has ? <span className="text-xs text-brand-700/50">—</span>
                          : below ? <span className="text-base font-black text-rose-500">✗</span>
                          : <span className="text-base font-black text-brand-600">✓</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-brand-100 px-4 py-2.5 text-[11px] font-semibold text-brand-700/70">
          Rank માત્ર આ જ પરીક્ષાનો છે — વિષયદીઠ, આ વર્ગમાં.
          {isInternal && ' આ આંતરિક ગણતરી છે.'}
        </p>
      </div>

      {/* કુલ પત્ર — ફક્ત ધોરણ ૯ માં */}
      {isStd9 && !isInternal && active?.code === 'ANNUAL' && <Summary subjects={subjects} />}
    </div>
  );
}

// ── ધોરણ ૯ : કુલ ૨૦૦ → /૧૦૦ ────────────────────────────────
function Summary({ subjects }) {
  const t = subjects.reduce((a, s) => a + (s.result?.total || 0), 0);
  const any = subjects.some((s) => s.result?.total !== null && s.result?.total !== undefined);
  if (!any) return null;

  const maxT = 200 * subjects.length;
  const out100 = Math.round((t / maxT) * 100 * 10) / 10;
  const pct = maxT ? (t / maxT) * 100 : 0;
  const passed = subjects.filter((s) => s.result?.pass === true).length;
  const failed = subjects.filter((s) => s.result?.pass === false).length;

  return (
    <div className="card card-pad">
      <h2 className="h-sub">સર્વશ્રેષ્ઠ પરિણામ</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="કુલ ગુણ" value={`${t}`} sub={`/${maxT}`} icon="📚" tone="brand" />
        <Stat label="પત્રે (÷૨)" value={out100} sub="/100" icon="🎯" tone="gold" />
        <Stat label="ટકાવારી" value={`${pct.toFixed(1)}%`} icon="📈" tone="brand" />
        <Stat label="પાસ" value={failed ? '✗' : '✓'} sub={failed ? `${failed} નાપાસ` : 'પાસ'} icon={failed ? '❌' : '✅'} tone={failed ? 'rose' : 'brand'} />
      </div>
      <p className="mt-3 text-xs font-semibold text-brand-700">
        કુલ {maxT} માંથી પત્રે ૧૦૦ ઉપર બદલાયેલ ગુણ દેખાવાય છે.
      </p>

      {/* આખરો નિર્ણય — કુલ ૨૦૦ થી */}
      <div className={`mt-3 rounded-2xl px-4 py-3 ring-1 ${
        failed ? 'bg-rose-50 text-rose-900 ring-rose-200' : 'bg-brand-50 text-brand-900 ring-brand-200'}`}>
        <p className="text-sm font-extrabold">
          {failed ? '✗ નાપાસ' : '✅ પાસ'}
        </p>
        <p className="mt-1 text-xs font-semibold">
          {failed
            ? <>નાપાસ વિષય : {subjects.filter((s) => s.result?.pass === false).map((s) => s.subject).join(', ')}</>
            : <>કુલ {maxT} માંથી પાસ ગુણ {Math.round(66 * subjects.length)} પહોંચ્યું.</>}
        </p>
        <p className="mt-1 text-[11px] font-semibold opacity-80">
          દરેક પરીક્ષાનો પોતાનો પાસ/નાપાસ ઉપર દેખાય છે — પણ આખરો નિર્ણય કુલ ગુણ પરથી થાય છે.
        </p>
      </div>
    </div>
  );
}
