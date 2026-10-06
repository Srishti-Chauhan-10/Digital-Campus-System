import React, { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast, Field } from '../../components/ui.jsx';
import { api, fmtDate, fmtTime } from '../../api.js';

const EXAMPLES = [
  'પાઇથાગોરસનું સૂત્ર લખો',
  '3x + 5 = 20 નું ઉકેલ આપો',
  'ત્રિકોણના કોણોનો સરવાળો કેટલો છે?',
  'વિજ્ઞાનમાં ધ્વનિ કેવી રીતે ઉત્પન્ન થાય છે?',
  'ભારતની ન્યાયપ્રણાલીના સ્તરો જણાવો',
  'भारत गौरव कविता का सार लिखिए',
];

export default function DoubtPortal() {
  const { user } = useAuth();
  const { push } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [openId, setOpenId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api(`/syllabus/${user.std}`).then((r) => setSubjects(r.subjects)).catch(() => {});
    loadHistory();
  }, [user.std]);

  const loadHistory = () => api('/student/dashboard').then((d) => setHistory(d.myDoubts)).catch(() => {});

  const ask = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return push('પ્રશ્ન લખો.', 'error');
    setBusy(true);
    try {
      const res = await api('/student/doubt', { method: 'POST', body: { question, subject: subject || null } });
      setAnswer(res);
      setQuestion('');
      loadHistory();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    } catch (e2) {
      push(e2.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const openDoubt = async (id) => {
    if (openId === id) return setOpenId(null);
    try {
      const r = await api(`/student/doubt/${id}`);
      setAnswer({
        id: r.doubt.id,
        answer: r.doubt.ai_answer,
        subject: r.doubt.subject_code,
        subjectName: r.doubt.subject_code,
        chapter: r.doubt.chapter,
        confidence: r.doubt.ai_conf,
        source: r.doubt.ai_source,
        sentToTeacher: true,
      });
      setOpenId(id);
    } catch (e) { push(e.message, 'error'); }
  };

  return (
    <Layout role="student">
      <header className="mb-5">
        <h1 className="h-title">💡 શંકા પોર્ટલ</h1>
        <p className="muted mt-1">
          પ્રશ્ન પૂછો — Axon ચોકસાઈ સાથે જવાબ આપશે, અને તમારો પ્રશ્ન શિક્ષકને પણ મોકલાશે.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ── પૂછવાનું ── */}
        <div>
          <form onSubmit={ask} className="card card-pad">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-xl text-white shadow-sm">
                🤖
              </div>
              <div>
                <p className="h-sub">Axon — તમારો અભ્યાસ સાથી</p>
                <p className="text-[11px] font-semibold text-brand-700/70">ફક્ત અભ્યાસક્રમ અનુસાર · ચોકસાઈ વધુ · અજાણ હોય તો શિક્ષકને મોકલે</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <Field label="વિષય (મરજિયામાં છોડવું પણ ચાલશે)">
                <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">આપોઆપ ઓળખી લઈશે</option>
                  {subjects.map((s) => <option key={s.id} value={s.code}>{s.gu}</option>)}
                </select>
              </Field>

              <Field label="તમારો પ્રશ્ન" hint="ઉદાહરણ : “3x + 5 = 20 નું ઉકેલ આપો”">
                <textarea
                  className="input min-h-[120px] resize-y"
                  placeholder="અહીં પ્રશ્ન લખો…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </Field>

              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'વિચારું છું…' : 'પૂછો'}
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700/70">ઉદાહરણ પ્રશ્ન</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXAMPLES.map((e) => (
                  <button key={e} type="button" onClick={() => setQuestion(e)}
                    className="chip bg-brand-100 text-brand-800 hover:bg-brand-200">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* ── જવાબ ── */}
        <div ref={bottomRef} className="space-y-4">
          {answer ? (
            <div className="card card-pad animate-fade-up">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="chip bg-brand-700 text-white">જવાબ</span>
                {answer.subjectName && <span className="chip bg-linden text-brand-900">{answer.subjectName}</span>}
                {answer.chapter ? <span className="chip bg-gold-200 text-brand-900">પ્રકરણ {answer.chapter}</span> : null}
                {answer.confidence > 0 && (
                  <span className="chip bg-brand-100 text-brand-800">ચોકસાઈ {Math.round(answer.confidence * 100)}%</span>
                )}
              </div>
              <p className="pre-line whitespace-pre-line text-[15px] leading-relaxed text-brand-900">{answer.answer}</p>

              <div className="mt-4 space-y-2 rounded-2xl bg-brand-50/80 p-3.5 text-xs font-semibold text-brand-800">
                <p>📚 સ્રોત : {answer.source}</p>
                {answer.sentToTeacher && <p>📨 આ પ્રશ્ન શિક્ષકને મોકલાયો છે — તેઓ ચકાસી જવાબ આપી શકે છે.</p>}
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <div className="py-6 text-center">
                <div className="text-4xl">🧭</div>
                <p className="h-sub mt-2">જવાબ અહીં દેખાશે</p>
                <p className="muted mt-1">
                  ગોશાળા ફક્ત અભ્યાસક્રમમાં હોય તેટલો જ ચોકસાઈ પૂરો જવાબ આપશે.
                  અજાણ હોય તો અંદાજ લગાવીને ખોટો જવાબ આપવાનું ટાળીને તરત શિક્ષકને મોકલી દેશે.
                </p>
              </div>
            </div>
          )}

          {/* ── ઇતિહાસ ── */}
          <div className="card">
            <div className="border-b border-brand-100 px-5 py-4">
              <h2 className="h-sub">મારા પ્રશ્નો</h2>
            </div>
            {history.length === 0 ? (
              <p className="muted px-5 py-8 text-center">હજુ કોઈ પ્રશ્ન નથી.</p>
            ) : (
              <ul className="divide-y divide-brand-100">
                {history.map((d) => (
                  <li key={d.id}>
                    <button onClick={() => openDoubt(d.id)} className="w-full px-5 py-3.5 text-left hover:bg-brand-50">
                      <p className="line-clamp-2 text-sm font-semibold text-brand-900">{d.question}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`chip ${d.status === 'open' ? 'bg-rose-100 text-rose-700'
                          : d.status === 'answered' ? 'bg-brand-100 text-brand-800' : 'bg-brand-100 text-brand-700/70'}`}>
                          {d.status === 'open' ? 'શિક્ષક પાસે છે' : d.status === 'answered' ? 'જવાબ આવ્યો' : 'બંધ'}
                        </span>
                        <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(d.created_at)} {fmtTime(d.created_at)}</span>
                      </div>
                    </button>
                    {openId === d.id && <DoubtDetail id={d.id} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DoubtDetail({ id }) {
  const { push } = useToast();
  const [d, setD] = useState(null);
  useEffect(() => {
    api(`/student/doubt/${id}`).then((r) => setD(r.doubt)).catch((e) => push(e.message, 'error'));
  }, [id]);
  if (!d) return null;
  return (
    <div className="space-y-3 border-t border-dashed border-brand-200 bg-brand-50/50 px-5 py-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700/70">AI જવાબ</p>
        <p className="pre-line mt-1 text-sm leading-relaxed text-brand-900">{d.ai_answer}</p>
      </div>
      {d.reply && (
        <div className="rounded-2xl bg-brand-700 px-4 py-3 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-linden">શિક્ષકનો જવાબ</p>
          <p className="pre-line mt-1 text-sm leading-relaxed">{d.reply}</p>
        </div>
      )}
    </div>
  );
}
