import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast } from '../../components/ui.jsx';
import { api } from '../../api.js';

export default function SyllabusBrowse() {
  const { user } = useAuth();
  const { push } = useToast();
  const [subjects, setSubjects] = useState(null);

  useEffect(() => {
    api(`/syllabus/${user.std}`).then((r) => setSubjects(r.subjects)).catch((e) => push(e.message, 'error'));
  }, [user.std, push]);

  return (
    <Layout role="student">
      <header className="mb-5">
        <h1 className="h-title">📚 અભ્યાસક્રમ</h1>
        <p className="muted mt-1">ધોરણ {user.std} — વિષય પસંદ કરો, એમાંથી પ્રકરણની યાદી ખૂલશે.</p>
      </header>

      {!subjects ? (
        <p className="muted">લોડ થાય છે…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link key={s.id} to={`/s/syllabus/${s.id}`}
              className="card card-pad group flex items-center gap-4 transition hover:shadow-lift">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-linden text-lg font-extrabold text-brand-800">
                {s.chapters.length}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-brand-900">{s.gu}</p>
                <p className="truncate text-[11px] font-semibold text-brand-700/70">{s.en}</p>
                <p className="mt-1 text-[11px] font-bold text-brand-700">
                  {s.chapters.length ? `${s.chapters.length} પ્રકરણ` : 'શિક્ષકે અપલોડ કર્યું નથી'}
                </p>
              </div>
              <span className="text-brand-400 transition group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
