import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast, Stat, Empty } from '../../components/ui.jsx';
import { api, fmtDate } from '../../api.js';
import { SCHOOL } from '../../data/schoolMeta.js';

const QUICK = [
  { to: '/s/doubt', icon: '💡', title: 'શંકા પોર્ટલ', sub: 'પૂછો — Axon તરત જવાબ આપશે', tone: 'from-linden to-kiwi' },
  { to: '/s/complaint', icon: '📝', title: 'ફરિયાદ', sub: 'ભવન કે કેમ્પસની સમસ્યા કરો', tone: 'from-sky to-cloud' },
  { to: '/s/bullying', icon: '🛡️', title: 'રેગિંગ', sub: 'ગુપત રીતે ફરિયાદ કરો', tone: 'from-rose-100 to-rose-50' },
  { to: '/s/helpline', icon: '☎️', title: 'હેલ્પલાઇન', sub: 'તકાલીન મદદ નંબર', tone: 'from-gold-200 to-citron' },
  { to: '/s/results', icon: '📊', title: 'પરિણામ', sub: 'વિષયવાર ગુણ જુઓ', tone: 'from-latte to-kiwi' },
  { to: '/s/syllabus', icon: '📚', title: 'અભ્યાસક્રમ', sub: 'વિષય → પ્રકરણ યાદી', tone: 'from-brand-100 to-linden' },
];

export default function StudentHome() {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/student/dashboard').then(setData).catch((e) => push(e.message, 'error'));
  }, [push]);

  if (!data) return <Layout role="student"><div className="card card-pad"><p className="muted">લોડ થાય છે…</p></div></Layout>;

  const { student, stats } = data;

  return (
    <Layout role="student">
      {/* ── વ્યક્તિગત સ્વાગત ── */}
      <section className="animate-fade-up relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-linden/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15 text-2xl font-extrabold ring-1 ring-white/25 backdrop-blur">
            {student.name_gu.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-linden">
              {SCHOOL.nameGu} — ડિજિટલ કેમ્પસ સિસ્ટમ
            </p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
              નમસ્તે {student.name_gu} 👋
            </h1>
            <p className="mt-1.5 text-sm text-white/85">
              ઉત્તર બુનિયાદી આશ્રમ શાળા ડિજિટલ કેમ્પસ સિસ્ટમમાં <b>સ્વાગત</b> છે.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip bg-white/15 text-white ring-1 ring-white/25">ધોરણ {student.std}</span>
              <span className="chip bg-gold-300 text-brand-900">રોલ નં. {student.roll_no}</span>
              {student.hostel === 'હા' && <span className="chip bg-white/15 text-white ring-1 ring-white/25">🏠 ભવનવાસી</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ── આંકડા ── */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="વિષયો" value={stats.totalSubjects} icon="📚" />
        <Stat label="ખુલ્લી શંકા" value={stats.openDoubts} icon="💡" tone="gold" />
        <Stat label="નવી ફરિયાદ" value={stats.openComplaints} icon="📝" tone="rose" />
        <Stat label="પરીક્ષા" value={data.exams.length} icon="📊" tone="sky" />
      </section>

      {/* ── ઝડપી પ્રવેશ ── */}
      <section className="mt-6">
        <h2 className="h-sub mb-3">ઝડપી પ્રવેશ</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to}
              className={`card card-pad !p-4 group bg-gradient-to-br ${q.tone} transition hover:shadow-lift`}>
              <div className="text-2xl">{q.icon}</div>
              <p className="mt-2 text-sm font-extrabold text-brand-900">{q.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-brand-800/70">{q.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ── મારી શંકાઓ ── */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
            <h2 className="h-sub">મારી શંકાઓ</h2>
            <Link to="/s/doubt" className="text-xs font-bold text-brand-700 hover:underline">બધું જુઓ →</Link>
          </div>
          {data.myDoubts.length === 0 ? (
            <Empty icon="💡" title="હજુ કોઈ શંકા નથી" hint="ગણિત, વિજ્ઞાન કે કોઈપણ વિષયનો પ્રશ્ન પૂછો." action={<Link to="/s/doubt" className="btn-primary">પ્રશ્ન પૂછો</Link>} />
          ) : (
            <ul className="divide-y divide-brand-100">
              {data.myDoubts.map((d) => (
                <li key={d.id} className="px-5 py-3.5">
                  <p className="line-clamp-2 text-sm font-semibold text-brand-900">{d.question}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`chip ${d.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-800'}`}>
                      {d.status === 'open' ? 'શિક્ષક પાસે' : d.status === 'answered' ? 'જવાબ મળ્યો' : 'બંધ'}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(d.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── મારી ફરિયાદ ── */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
            <h2 className="h-sub">મારી ફરિયાદ</h2>
            <Link to="/s/complaint" className="text-xs font-bold text-brand-700 hover:underline">બધું જુઓ →</Link>
          </div>
          {data.myComplaints.length === 0 ? (
            <Empty icon="📝" title="કોઈ ફરિયાદ નથી"
              hint="ભવન, કેમ્પસ કે રેગિંગની સમસ્યા હોય તો અહીં કરો."
              action={<Link to="/s/complaint" className="btn-primary">ફરિયાદ કરો</Link>} />
          ) : (
            <ul className="divide-y divide-brand-100">
              {data.myComplaints.slice(0, 6).map((c) => (
                <li key={c.id} className="px-5 py-3.5">
                  <p className="line-clamp-1 text-sm font-semibold text-brand-900">{c.subject || c.details}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="chip bg-brand-100 text-brand-800">
                      {c.category === 'hostel' ? '🏠 ભવન' : c.category === 'campus' ? '🏫 કેમ્પસ' : '🛡️ રેગિંગ'}
                    </span>
                    <span className="chip bg-gold-100 text-brand-900">{c.status}</span>
                    <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(c.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
