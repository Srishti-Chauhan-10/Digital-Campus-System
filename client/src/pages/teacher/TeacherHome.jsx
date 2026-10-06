import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast, Stat } from '../../components/ui.jsx';
import { api, fmtDate } from '../../api.js';
import { SCHOOL } from '../../../../data/schoolMeta.js';

const CARDS = [
  { to: '/t/doubts', icon: '💡', title: 'વિદ્યાર્થીની શંકા', sub: 'પ્રશ્ન જુઓ અને જવાબ આપો' },
  { to: '/t/complaints', icon: '📝', title: 'ફરિયાદ', sub: 'ભવન · કેમ્પસ · રેગિંગ' },
  { to: '/t/syllabus', icon: '📚', title: 'અભ્યાસક્રમ અપલોડ', sub: 'પ્રકરણ ઉમેરો' },
  { to: '/t/marks', icon: '📊', title: 'ગુણ અપલોડ', sub: 'રોલ નં. પ્રમાણે' },
  { to: '/t/students', icon: '👥', title: 'વિદ્યાર્થી યાદી', sub: 'નામ, રોલ નં., વિગત' },
  { to: '/t/guide', icon: '🗂️', title: 'ડેટા માર્ગદર્શક', sub: 'જાતે ડેટા કેવી રીતે નાખવો' },
  { to: '/t/password', icon: '🔑', title: 'મારો પાસવર્ડ', sub: 'પાસવર્ડ બદલો' },
  { to: '/t/backup', icon: '💾', title: 'ડેટા બેકઅપ', sub: 'ડેટા સુરક્ષિત રાખો' },
];

export default function TeacherHome() {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/teacher/dashboard').then(setData).catch((e) => push(e.message, 'error'));
  }, [push]);

  if (!data) return <Layout role="teacher"><p className="muted">લોડ થાય છે…</p></Layout>;
  const { stats, recentDoubts } = data;

  return (
    <Layout role="teacher">
      <section className="animate-fade-up relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-gold-300/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15 text-2xl font-extrabold ring-1 ring-white/25 backdrop-blur">
            {user.name_gu.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-linden">
              {SCHOOL.nameGu} — શિક્ષક પોર્ટલ
            </p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">નમસ્તે {user.name_gu} 👋</h1>
            <p className="mt-1.5 text-sm text-white/85">
              {user.role} · મોબાઇલ <b className="tracking-wider">{user.phone}</b> થી લોગઇન
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="ખુલ્લી શંકા" value={stats.openDoubts} icon="💡" tone="gold" />
        <Stat label="નવી ફરિયાદ" value={stats.newComplaints} icon="📝" tone="rose" />
        <Stat label="ભવન" value={stats.hostel} icon="🏠" />
        <Stat label="કેમ્પસ" value={stats.campus} icon="🏫" tone="sky" />
        <Stat label="રેગિંગ" value={stats.bullying} icon="🛡️" tone="rose" />
        <Stat label="વિદ્યાર્થી" value={stats.students} icon="👥" tone="sky" />
      </section>

      <section className="mt-6">
        <h2 className="h-sub mb-3">કામની યાદી</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="card card-pad !p-4 transition hover:shadow-lift">
              <div className="text-2xl">{c.icon}</div>
              <p className="mt-2 text-sm font-extrabold text-brand-900">{c.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-brand-700/70">{c.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="h-sub">તાજેતરના પ્રશ્નો</h2>
          <Link to="/t/doubts" className="text-xs font-bold text-brand-700 hover:underline">બધા જુઓ →</Link>
        </div>
        {recentDoubts.length === 0 ? (
          <p className="muted px-5 py-8 text-center">હજુ કોઈ પ્રશ્ન નથી.</p>
        ) : (
          <ul className="divide-y divide-brand-100">
            {recentDoubts.map((d) => (
              <li key={d.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="chip bg-brand-100 text-brand-800">
                    {d.name_gu || 'વિદ્યાર્થી'} · રોલ {d.roll_no} · ધોરણ {d.std}
                  </span>
                  <span className={`chip ${d.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-800'}`}>
                    {d.status === 'open' ? 'નવો' : d.status === 'answered' ? 'જવાબ આપ્યો' : 'બંધ'}
                  </span>
                  <span className="text-brand-700/60">{fmtDate(d.created_at)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-brand-900">{d.question}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
