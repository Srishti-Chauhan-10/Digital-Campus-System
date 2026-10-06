import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Empty, Tabs, Field } from '../../components/ui.jsx';
import { api, fmtDate, fmtTime } from '../../api.js';
import { STATUS_STYLE } from '../../../../data/schoolMeta.js';

export default function TeacherDoubts() {
  const { push } = useToast();
  const [status, setStatus] = useState('open');
  const [std, setStd] = useState('');
  const [doubts, setDoubts] = useState(null);
  const [replyFor, setReplyFor] = useState(null);
  const [reply, setReply] = useState('');

  const load = () => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (std) q.set('std', std);
    api(`/teacher/doubts?${q}`).then((r) => setDoubts(r.doubts)).catch((e) => push(e.message, 'error'));
  };
  useEffect(load, [status, std]);

  const send = async (id) => {
    if (!reply.trim()) return push('જવાબ લખો.', 'error');
    try {
      await api(`/teacher/doubt/${id}/reply`, { method: 'POST', body: { reply } });
      push('જવાબ મોકલી દીધો. વિદ્યાર્થીને તરત દેખાશે.');
      setReply(''); setReplyFor(null); load();
    } catch (e) { push(e.message, 'error'); }
  };

  const close = async (id) => {
    try { await api(`/teacher/doubt/${id}/close`, { method: 'POST' }); load(); } catch (e) { push(e.message, 'error'); }
  };

  return (
    <Layout role="teacher">
      <header className="mb-5">
        <h1 className="h-title">💡 વિદ્યાર્થીની શંકા</h1>
        <p className="muted mt-1">વિદ્યાર્થીઓના બધા પ્રશ્ન અહીં — AI જવાબ પણ સાથે દેખાશે, ચકાસી જવાબ આપો.</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Tabs
            value={status}
            onChange={setStatus}
            tabs={[
              { value: 'open', label: 'ખુલ્લા' },
              { value: 'answered', label: 'જવાબ આપ્યા' },
              { value: 'closed', label: 'બંધ' },
              { value: '', label: 'બધા' },
            ]}
          />
        </div>
        <select className="input w-auto" value={std} onChange={(e) => setStd(e.target.value)}>
          <option value="">બંને ધોરણ</option>
          <option value="9">ધોરણ ૯</option>
          <option value="10">ધોરણ ૧૦</option>
        </select>
      </div>

      {!doubts ? <p className="muted">લોડ થાય છે…</p>
        : doubts.length === 0 ? (
          <div className="card"><Empty icon="✅" title="કોઈ પ્રશ્ન નથી" hint="આ ફિલ્ટરમાં કંઈ મળ્યું નથી." /></div>
        ) : (
          <ul className="space-y-3">
            {doubts.map((d) => (
              <li key={d.id} className="card card-pad">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip bg-brand-700 text-white">
                    {d.name_gu || 'વિદ્યાર્થી'} · રોલ {d.roll_no} · ધોરણ {d.std}
                  </span>
                  {d.subject_code && <span className="chip bg-linden text-brand-900">{d.subject_code}</span>}
                  {d.chapter ? <span className="chip bg-gold-200 text-brand-900">પ્રકરણ {d.chapter}</span> : null}
                  <span className={`chip ${STATUS_STYLE[d.status] || ''}`}>
                    {d.status === 'open' ? 'નવો' : d.status === 'answered' ? 'જવાબ આપ્યો' : 'બંધ'}
                  </span>
                  <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(d.created_at)} {fmtTime(d.created_at)}</span>
                </div>

                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-brand-900">{d.question}</p>

                {d.ai_answer && (
                  <div className="mt-3 rounded-2xl bg-brand-50/80 p-3.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700/70">
                      🤖 AI જવાબ {d.ai_conf ? `· ચોકસાઈ ${Math.round(d.ai_conf * 100)}%` : ''}
                    </p>
                    <p className="pre-line mt-1 text-sm leading-relaxed text-brand-800">{d.ai_answer}</p>
                    {d.ai_source && <p className="mt-1.5 text-[11px] font-semibold text-brand-700/60">📚 {d.ai_source}</p>}
                  </div>
                )}

                {d.reply && (
                  <div className="mt-3 rounded-2xl bg-brand-700 p-3.5 text-white">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-linden">તમારો જવાબ</p>
                    <p className="pre-line mt-1 text-sm leading-relaxed">{d.reply}</p>
                  </div>
                )}

                {replyFor === d.id ? (
                  <div className="mt-3">
                    <Field label="જવાબ">
                      <textarea className="input min-h-[100px] resize-y" value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="વિદ્યાર્થીને સમજાય તેવો જવાબ લખો…" />
                    </Field>
                    <div className="mt-2 flex gap-2">
                      <button className="btn-primary" onClick={() => send(d.id)}>મોકલો</button>
                      <button className="btn-ghost" onClick={() => { setReplyFor(null); setReply(''); }}>રદ કરો</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!d.reply && <button className="btn-primary" onClick={() => setReplyFor(d.id)}>✍️ જવાબ આપો</button>}
                    {d.status !== 'closed' && <button className="btn-ghost" onClick={() => close(d.id)}>બંધ કરો</button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
    </Layout>
  );
}
