import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Empty, Tabs, Field } from '../../components/ui.jsx';
import { api, fmtDate, fmtTime } from '../../api.js';
import { COMPLAINT_CATEGORIES, STATUS_STYLE } from '../../../../data/schoolMeta.js';

const NEXT_STATUS = { 'નવી': ['ચર્ચામાં', 'ઉકેલાઈ', 'નકારાયેલ'], 'ચર્ચામાં': ['ઉકેલાઈ', 'નકારાયેલ'], 'ઉકેલાઈ': [], 'નકારાયેલ': [] };

export default function TeacherComplaints() {
  const { push } = useToast();
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [list, setList] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');

  const load = () => {
    const q = new URLSearchParams();
    if (cat) q.set('category', cat);
    if (status) q.set('status', status);
    api(`/teacher/complaints?${q}`).then((r) => setList(r.complaints)).catch((e) => push(e.message, 'error'));
  };
  useEffect(load, [cat, status]);

  const setState = async (id, st) => {
    try {
      await api(`/teacher/complaint/${id}/status`, {
        method: 'POST', body: { status: st, note: noteFor === id ? note : '' },
      });
      push(`સ્થિતિ બદલાઈ : ${st}`);
      setNoteFor(null); setNote(''); load();
    } catch (e) { push(e.message, 'error'); }
  };

  return (
    <Layout role="teacher">
      <header className="mb-5">
        <h1 className="h-title">📝 ફરિયાદ</h1>
        <p className="muted mt-1">ત્રણ શ્રેણી — ભવન/હોસ્ટેલ, કેમ્પસ અને રેગિંગ.</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[280px] flex-1">
          <Tabs
            value={cat}
            onChange={setCat}
            tabs={[
              { value: '', label: 'બધા' },
              { value: 'hostel', label: '🏠 ભવન' },
              { value: 'campus', label: '🏫 કેમ્પસ' },
              { value: 'bullying', label: '🛡️ રેગિંગ' },
            ]}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">બધી સ્થિતિ</option>
          <option>નવી</option><option>ચર્ચામાં</option><option>ઉકેલાઈ</option><option>નકારાયેલ</option>
        </select>
      </div>

      {!list ? <p className="muted">લોડ થાય છે…</p>
        : list.length === 0 ? (
          <div className="card"><Empty icon="✅" title="કોઈ ફરિયાદ નથી" hint="આ ફિલ્ટરમાં કંઈ મળ્યું નથી." /></div>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => {
              const meta = COMPLAINT_CATEGORIES.find((x) => x.value === c.category);
              const isBully = c.category === 'bullying';
              return (
                <li key={c.id} className={`card card-pad ${isBully ? 'border-rose-200' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-brand-700 text-white">{meta?.icon} {meta?.label}</span>
                    <span className={`chip ${STATUS_STYLE[c.status] || ''}`}>{c.status}</span>
                    {c.severity && c.severity !== 'સામાન્ય' && <span className="chip bg-rose-100 text-rose-700">{c.severity}</span>}
                    <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(c.created_at)} {fmtTime(c.created_at)}</span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-brand-700">
                    👤 {c.name_gu} · રોલ {c.roll_no} · ધોરણ {c.std}{c.location ? ` · 📍 ${c.location}` : ''}
                  </p>
                  {c.subject && <p className="mt-2 text-[15px] font-extrabold text-brand-900">{c.subject}</p>}
                  <p className="pre-line mt-1 text-sm leading-relaxed text-brand-800/90">{c.details}</p>

                  {c.note && (
                    <p className="mt-2 rounded-xl bg-gold-100 px-3 py-2 text-xs font-semibold text-brand-900">🗨️ {c.note}</p>
                  )}

                  {noteFor === c.id ? (
                    <div className="mt-3">
                      <Field label="ટીપ્પણી (વિદ્યાર્થીને દેખાશે)">
                        <textarea className="input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)}
                          placeholder="દા.ત. વાર નિર્માણ અધિકારીને જણાવ્યું, અઠવાડિયે સુધારાશે." />
                      </Field>
                      <div className="mt-2 flex gap-2">
                        <button className="btn-primary" onClick={() => setState(c.id, c.status)}>ટીપ્પણી સાચવો</button>
                        <button className="btn-ghost" onClick={() => { setNoteFor(null); setNote(''); }}>રદ</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(NEXT_STATUS[c.status] || []).map((s) => (
                        <button key={s} className="btn-soft" onClick={() => setState(c.id, s)}>→ {s}</button>
                      ))}
                      <button className="btn-ghost" onClick={() => { setNoteFor(c.id); setNote(c.note || ''); }}>🗨️ ટીપ્પણી</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </Layout>
  );
}
