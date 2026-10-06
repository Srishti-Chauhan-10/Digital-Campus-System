import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './ui.jsx';
import { SCHOOL } from '../../../data/schoolMeta.js';

const STUDENT_NAV = [
  { to: '/s', label: 'હોમ', icon: '🏠', end: true },
  { to: '/s/doubt', label: 'શંકા પોર્ટલ', icon: '💡' },
  { to: '/s/complaint', label: 'ફરિયાદ', icon: '📝' },
  { to: '/s/bullying', label: 'રેગિંગ', icon: '🛡️' },
  { to: '/s/helpline', label: 'હેલ્પલાઇન', icon: '☎️' },
  { to: '/s/results', label: 'પરિણામ', icon: '📊' },
  { to: '/s/syllabus', label: 'અભ્યાસક્રમ', icon: '📚' },
];

const TEACHER_NAV = [
  { to: '/t', label: 'હોમ', icon: '🏠', end: true },
  { to: '/t/doubts', label: 'વિદ્યાર્થીની શંકા', icon: '💡' },
  { to: '/t/complaints', label: 'ફરિયાદ', icon: '📝' },
  { to: '/t/syllabus', label: 'અભ્યાસક્રમ', icon: '📚' },
  { to: '/t/marks', label: 'ગુણ અપલોડ', icon: '📊' },
  { to: '/t/students', label: 'વિદ્યાર્થી યાદી', icon: '👥' },
  { to: '/t/guide', label: 'ડેટા માર્ગદર્શક', icon: '🗂️' },
  { to: '/t/password', label: 'મારો પાસવર્ડ', icon: '🔑' },
  { to: '/t/backup', label: 'ડેટા બેકઅપ', icon: '💾' },
];

function Logo({ size = 'md' }) {
  const s = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  return <img src="/logo.png" alt="શાળાનો લોગો" className={`${s} shrink-0 object-contain drop-shadow-sm`} />;
}

export default function Layout({ role, children, title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavItems = ({ onClick }) => (
    <nav className="space-y-1">
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition
             ${isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-100'}`
          }
        >
          <span className="text-base">{n.icon}</span>
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const Identity = () => (
    <div className="rounded-2xl bg-gradient-to-br from-brand-100 to-kiwi/60 p-3.5">
      <p className="text-sm font-extrabold text-brand-900">{user?.name_gu}</p>
      <p className="text-xs font-semibold text-brand-700">
        {role === 'student' ? `ધોરણ ${user?.std} · રોલ નં. ${user?.roll_no}` : `${user?.role} · ${user?.phone}`}
      </p>
    </div>
  );

  return (
    <div className="min-h-full">
      {/* મોબાઇલ ટોપબાર */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-brand-100 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-brand-800 hover:bg-brand-100" aria-label="મેનુ">☰</button>
        <Logo size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-brand-900">{title || SCHOOL.nameGu}</p>
          <p className="truncate text-[11px] font-semibold text-brand-700/70">ડિજિટલ કેમ્પસ સિસ્ટમ</p>
        </div>
        <button onClick={handleLogout} className="rounded-xl p-2 text-brand-700 hover:bg-brand-100" aria-label="લોગઆઉટ">⏻</button>
      </header>

      {/* ડ્રાઅર */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="animate-pop relative h-full w-72 max-w-[85vw] overflow-auto bg-cream p-4 shadow-lift">
            <div className="mb-4 flex items-center gap-3">
              <Logo />
              <div>
                <p className="text-sm font-extrabold leading-tight text-brand-900">{SCHOOL.nameGu}</p>
                <p className="text-[11px] font-semibold text-brand-700/70">LEARN · GROW · SERVE</p>
              </div>
            </div>
            <div className="mb-4"><Identity /></div>
            <NavItems onClick={() => setOpen(false)} />
            <button onClick={handleLogout} className="btn-ghost mt-4 w-full">લોગઆઉટ</button>
          </aside>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* ડેસ્કટોપ સાઇડબાર */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-4 border-r border-brand-100 bg-cream/60 p-5 backdrop-blur lg:flex">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold leading-tight text-brand-900">{SCHOOL.nameGu}</p>
              <p className="text-[11px] font-semibold text-brand-700/70">{SCHOOL.board}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gold-600">Learn · Grow · Serve</p>
            </div>
          </div>

          <Identity />
          <NavItems />
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-gold-200 bg-gold-100/70 p-3 text-[11px] font-semibold leading-relaxed text-brand-800">
              શકાય ત્યારે જ પૂછો — શંકા પોર્ટલ 24 × 7 ખુલ્લો છે.
            </div>
            <button onClick={handleLogout} className="btn-ghost w-full">લોગઆઉટ</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {title && <h1 className="sr-only">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
