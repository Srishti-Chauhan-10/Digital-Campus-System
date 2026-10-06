import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Field, Modal, Empty, Tabs } from '../../components/ui.jsx';
import { api } from '../../api.js';
import { MONTHS } from '../../data/months.js';

export default function TeacherSyllabus() {
  const { push } = useToast();
  const [std, setStd] = useState(9);
  const [subjects, setSubjects] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [newSub, setNewSub] = useState({ code: '', gu: '', en: '', max: 100 });

  const load = () => api(`/syllabus/${std}`).then((r) => setSubjects(r.subjects)).catch((e) => push(e.message, 'error'));
  useEffect(load, [std]);

  const openSubject = async (s) => {
    setOpenId(s.id);
    const r = await api(`/syllabus/subject/${s.id}`).catch((e) => push(e.message, 'error'));
    setChapters(r?.chapters || []);
  };

  const refreshChapters = () => openSubject(subjects.find((s) => s.id === openId));

  const addSubject = async () => {
    try {
      await api('/teacher/syllabus/subject', { method: 'POST', body: { std, ...newSub } });
      push('વિષય ઉમેરાયો.');
      setNewSub({ code: '', gu: '', en: '', max: 100 });
      setAddOpen(false); load();
    } catch (e) { push(e.message, 'error'); }
  };

  const delSubject = async (id) => {
    if (!confirm('આ વિષય અને તેના બધા પ્રકરણ કાઢી નાખવા? ગુણ પણ કાઢાય જશે.')) return;
    try { await api(`/teacher/syllabus/subject/${id}`, { method: 'DELETE' }); push('વિષય કાઢી દીધો.'); setOpenId(null); load(); }
    catch (e) { push(e.message, 'error'); }
  };

  return (
    <Layout role="teacher">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-title">📚 અભ્યાસક્રમ અપલોડ</h1>
          <p className="muted mt-1">વિષય → પ્રકરણ. વિદ્યાર્થીને તરત દેખાશે.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={std} onChange={(e) => { setStd(Number(e.target.value)); setOpenId(null); }}>
            <option value={9}>ધોરણ ૯</option>
            <option value={10}>ધોરણ ૧૦</option>
          </select>
          <button className="btn-primary" onClick={() => setAddOpen(true)}>+ નવો વિષય</button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className={`card card-pad transition ${openId === s.id ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-brand-900">{s.gu}</p>
                <p className="truncate text-[11px] font-semibold text-brand-700/70">{s.en} · કોડ {s.code}</p>
              </div>
              <span className="chip bg-brand-100 text-brand-800">{s.chapters.length} પ્રકરણ</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-soft" onClick={() => openSubject(s)}>
                {openId === s.id ? 'બંધ કરો' : 'પ્રકરણ જુઓ'}
              </button>
              <button className="btn-ghost" onClick={() => delSubject(s.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── પ્રકરણ યાદી ── */}
      {openId && (
        <section className="card mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 px-5 py-4">
            <h2 className="h-sub">પ્રકરણ યાદી</h2>
            <div className="flex gap-2">
              <button className="btn-gold" onClick={() => setBulkOpen(true)}>📋 ઘણું એકસાથે</button>
              <button className="btn-primary" onClick={() => setAddOpen(true)}>+ પ્રકરણ</button>
            </div>
          </div>
          {chapters.length === 0 ? (
            <Empty icon="📚" title="હજુ કોઈ પ્રકરણ નથી" hint="ઉપર થી એક પ્રકરણ ઉમેરો કે નીચેની જલદી નિવાડી વાપરો." />
          ) : (
            <ol className="divide-y divide-brand-100">
              {chapters.map((c) => (
                <li key={c.no} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-extrabold text-brand-800">{c.no}</span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-brand-900">{c.name}</span>
                  {c.month && <span className="chip bg-gold-100 text-brand-900">{c.month}</span>}
                  {c.source === 'gseb' && <span className="chip bg-linden text-brand-900">GSEB</span>}
                  <button className="rounded-lg px-2 py-1 text-brand-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={async () => {
                      if (!confirm(`"${c.name}" કાઢવું?`)) return;
                      await api(`/teacher/syllabus/chapter/${c.id}`, { method: 'DELETE' }).catch(() => {});
                      refreshChapters();
                    }}
                    title="કાઢો">✕</button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* ── નવો પ્રકરણ ── */}
      <ChapterModal open={addOpen && !!openId} onClose={() => setAddOpen(false)} subjectId={openId} onDone={refreshChapters} />

      {/* ── જલદી નિવાડી ── */}
      <BulkModal open={bulkOpen && !!openId} onClose={() => setBulkOpen(false)} subjectId={openId} onDone={refreshChapters} />

      {/* ── નવો વિષય ── */}
      <Modal open={addOpen && !openId} onClose={() => setAddOpen(false)} title="નવો વિષય ઉમેરો">
        <div className="space-y-3">
          <Field label="વિષય કોડ (અંગ્રેજીમાં, ટૂંક)">
            <input className="input" placeholder="દા.ત. BIO" value={newSub.code} onChange={(e) => setNewSub({ ...newSub, code: e.target.value })} />
          </Field>
          <Field label="વિષયનું ગુજરાતી નામ">
            <input className="input" placeholder="દા.ત. જીવવિજ્ઞાન" value={newSub.gu} onChange={(e) => setNewSub({ ...newSub, gu: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="અંગ્રેજી નામ">
              <input className="input" value={newSub.en} onChange={(e) => setNewSub({ ...newSub, en: e.target.value })} />
            </Field>
            <Field label="પૂર્ણ ગુણ">
              <input className="input" type="number" value={newSub.max} onChange={(e) => setNewSub({ ...newSub, max: e.target.value })} />
            </Field>
          </div>
          <button className="btn-primary w-full" onClick={addSubject}>ઉમેરો</button>
        </div>
      </Modal>
    </Layout>
  );
}

function ChapterModal({ open, onClose, subjectId, onDone }) {
  const { push } = useToast();
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  useEffect(() => { if (open) { setName(''); setMonth(''); } }, [open]);
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="નવું પ્રકરણ">
      <div className="space-y-3">
        <Field label="પ્રકરણનું નામ">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="દા.ત. ત્રિકોણમિતિના ઉપયોગો" />
        </Field>
        <Field label="માસ">
          <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">પસંદ કરો</option>
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <button className="btn-primary w-full" onClick={async () => {
          if (!name.trim()) return push('નામ લખો.', 'error');
          try {
            await api('/teacher/syllabus/chapter', { method: 'POST', body: { subjectId, name, month } });
            push('પ્રકરણ ઉમેરાયું.'); onClose(); onDone();
          } catch (e) { push(e.message, 'error'); }
        }}>ઉમેરો</button>
      </div>
    </Modal>
  );
}

function BulkModal({ open, onClose, subjectId, onDone }) {
  const { push } = useToast();
  const [text, setText] = useState('');
  useEffect(() => { if (open) setText(''); }, [open]);
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="ઘણાં પ્રકરણ એકસાથે" wide>
      <div className="space-y-3">
        <p className="muted">
          દરેક લાઇનમાં એક પ્રકરણ. માસ લખવો હોય તો છેલ્લે અલ્પવિરામથી લખો :
          <code className="mt-1 block rounded-lg bg-brand-100 px-3 py-2 text-xs font-bold text-brand-800">
            ત્રિકોણમિતિના ઉપયોગો, નવેમ્બર<br />
            વર્તુળ, ડિસેમ્બર
          </code>
        </p>
        <textarea className="input min-h-[180px] font-mono text-sm" value={text}
          onChange={(e) => setText(e.target.value)} placeholder={'પ્રકરણ ૧, જૂન\nપ્રકરણ ૨, જુલાઈ'} />
        <button className="btn-primary w-full" onClick={async () => {
          try {
            const r = await api('/teacher/syllabus/chapter/bulk', { method: 'POST', body: { subjectId, text } });
            push(`${r.added} પ્રકરણ ઉમેરાયાં.`); onClose(); onDone();
          } catch (e) { push(e.message, 'error'); }
        }}>ઉમેરો</button>
      </div>
    </Modal>
  );
}
