import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Field, Modal, Empty, Tabs } from '../../components/ui.jsx';
import { api } from '../../api.js';

const BLANK = { std: 9, roll_no: '', name_gu: '', name_en: '', gender: 'કુમાર', parent_name: '', parent_phone: '', blood_group: '', hostel: 'ના' };

export default function TeacherStudents() {
  const { push } = useToast();
  const [std, setStd] = useState('9');
  const [list, setList] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [q, setQ] = useState('');

  const load = () => api(`/teacher/students?std=${std}`).then((r) => setList(r.students)).catch((e) => push(e.message, 'error'));
  useEffect(load, [std]);

  const shown = (list || []).filter((s) =>
    !q || s.name_gu.includes(q) || s.name_en?.toLowerCase().includes(q.toLowerCase()) || String(s.roll_no) === q);

  const add = async () => {
    try {
      await api('/teacher/students', { method: 'POST', body: { ...form, std: Number(form.std) } });
      push(`${form.name_gu} ઉમેરાયા.`); setForm(BLANK); setAddOpen(false); setStd(String(form.std)); load();
    } catch (e) { push(e.message, 'error'); }
  };

  const remove = async (s) => {
    if (!confirm(`${s.name_gu} (રોલ ${s.roll_no}) ને યાદીમાંથી કાઢવું?`)) return;
    try { await api(`/teacher/students/${s.id}`, { method: 'DELETE' }); push('કાઢી દીધું.'); load(); }
    catch (e) { push(e.message, 'error'); }
  };

  return (
    <Layout role="teacher">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-title">👥 વિદ્યાર્થી યાદી</h1>
          <p className="muted mt-1">નામ અને રોલ નંબર નોંધો — વિદ્યાર્થી આ જ રોલ નંબરથી લોગઇન કરી શકશે.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={std} onChange={(e) => setStd(e.target.value)}>
            <option value="9">ધોરણ ૯</option>
            <option value="10">ધોરણ ૧૦</option>
          </select>
          <input className="input w-40" placeholder="શોધો…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary" onClick={() => setAddOpen(true)}>+ નવો વિદ્યાર્થી</button>
        </div>
      </header>

      {!list ? <p className="muted">લોડ થાય છે…</p>
        : shown.length === 0 ? (
          <div className="card"><Empty icon="👥" title="કોઈ વિદ્યાર્થી નથી" hint="ઉપરથી નવો વિદ્યાર્થી ઉમેરો." /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-50/70">
                    {['રોલ', 'નામ', 'પિતાનું નામ', 'મોબાઇલ', 'લિંગ', 'ભવન', ''].map((h, i) => (
                      <th key={i} className="px-3 py-2.5 text-left font-extrabold text-brand-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {shown.map((s) => (
                    <tr key={s.id} className="hover:bg-brand-50/40">
                      <td className="px-3 py-2.5 font-extrabold text-brand-800">{s.roll_no}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-brand-900">{s.name_gu}</p>
                        {s.name_en && <p className="text-[11px] text-brand-700/60">{s.name_en}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-brand-800">{s.parent_name || '—'}</td>
                      <td className="px-3 py-2.5 tracking-wider text-brand-800">{s.parent_phone || '—'}</td>
                      <td className="px-3 py-2.5">
                        <td className="px-3 py-2.5 text-brand-800">{s.gender === 'કન્યા' ? 'કન્યા' : s.gender === 'કુમાર' ? 'કુમાર' : 'કુમાર'}</td>
                        <span className={`chip ${s.hostel === 'હા' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-800'}`}>{s.hostel}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button className="rounded-lg px-2 py-1 text-brand-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(s)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-brand-100 px-4 py-3 text-[11px] font-semibold text-brand-700/70">
              કુલ {shown.length} વિદ્યાર્થી · પાસવર્ડ : ધોરણ ૯ = <b>student9</b> · ધોરણ ૧૦ = <b>student10</b>
            </p>
          </div>
        )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="નવો વિદ્યાર્થી">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ધોરણ">
              <select className="input" value={form.std} onChange={(e) => setForm({ ...form, std: e.target.value })}>
                <option value={9}>ધોરણ ૯</option>
                <option value={10}>ધોરણ ૧૦</option>
              </select>
            </Field>
            <Field label="રોલ નંબર">
              <input className="input" inputMode="numeric" value={form.roll_no}
                onChange={(e) => setForm({ ...form, roll_no: e.target.value.replace(/\D/g, '') })} />
            </Field>
          </div>
          <Field label="નામ (ગુજરાતી)">
            <input className="input" value={form.name_gu} onChange={(e) => setForm({ ...form, name_gu: e.target.value })} />
          </Field>
          <Field label="નામ (અંગ્રેજી)">
            <input className="input" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="લિંગ">
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="કુમાર">કુમાર</option><option value="કન્યા">કન્યા</option>
              </select>
            </Field>
            <Field label="ભવન">
              <select className="input" value={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.value })}>
                <option>ના</option><option>હા</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="પિતાનું નામ">
              <input className="input" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
            </Field>
            <Field label="મોબાઇલ">
              <input className="input" inputMode="numeric" value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </Field>
          </div>
          <button className="btn-primary w-full" onClick={add}>ઉમેરો</button>
        </div>
      </Modal>

    </Layout>
  );
}
