import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { useToast, Empty } from '../../components/ui.jsx';
import { api } from '../../api.js';

export default function SyllabusSubject() {
  const { id } = useParams();
  const { push } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/syllabus/subject/${id}`).then(setData).catch((e) => push(e.message, 'error'));
  }, [id, push]);

  const byMonth = (data?.chapters || []).reduce((acc, c) => {
    (acc[c.month || 'અન્ય'] = acc[c.month || 'અન્ય'] || []).push(c);
    return acc;
  }, {});

  return (
    <Layout role="student">
      <Link to="/s/syllabus" className="mb-3 inline-block text-xs font-bold text-brand-700 hover:underline">← બધા વિષય</Link>

      {!data ? (
        <p className="muted">લોડ થાય છે…</p>
      ) : (
        <>
          <header className="card mb-5 bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-linden">ધોરણ {data.subject.std}</p>
            <h1 className="mt-1 text-2xl font-extrabold">{data.subject.gu}</h1>
            <p className="text-sm text-white/80">{data.subject.en}</p>
            <p className="mt-2 text-xs font-semibold text-white/70">
              કુલ {data.chapters.length} પ્રકરણ
            </p>
          </header>

          {data.chapters.length === 0 ? (
            <div className="card">
              <Empty icon="📚" title="આ વિષયનો અભ્યાસક્રમ શિક્ષકે અપલોડ કર્યો હોય ત્યારે દેખાશે."
                hint="ટૂંકી વારમાં ઉપલબ્ધ થઈ જશે." />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byMonth).map(([month, list]) => (
                <div key={month} className="card">
                  <div className="flex items-center gap-2 border-b border-brand-100 px-5 py-3.5">
                    <span className="chip bg-brand-700 text-white">{month}</span>
                    <span className="muted">{list.length} પ્રકરણ</span>
                  </div>
                  <ol className="divide-y divide-brand-100">
                    {list.map((c) => (
                      <li key={c.no} className="flex items-start gap-3 px-5 py-3">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-extrabold text-brand-800">
                          {c.no}
                        </span>
                        <span className="text-sm font-semibold leading-relaxed text-brand-900">{c.name}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
