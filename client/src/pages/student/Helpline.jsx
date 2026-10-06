import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Tabs } from '../../components/ui.jsx';
import { api } from '../../api.js';

const CATS = [
  { value: 'all', label: 'બધા' },
  { value: 'emergency', label: 'ઈમર્જન્સી' },
  { value: 'medical', label: 'મેડિકલ' },
  { value: 'police', label: 'પોલીસ' },
  { value: 'women', label: 'મહિલા' },
  { value: 'child', label: 'બાળક' },
  { value: 'school', label: 'શાળા' },
];

const CAT_ICON = {
  emergency: '🆘', medical: '🚑', police: '🚓', fire: '🚒',
  women: '👩', child: '🧒', cyber: '💻', school: '🏫',
};

export default function Helpline() {
  const { push } = useToast();
  const [lines, setLines] = useState([]);
  const [cat, setCat] = useState('all');

  useEffect(() => {
    api('/student/helplines').then((r) => setLines(r.helplines)).catch((e) => push(e.message, 'error'));
  }, [push]);

  const shown = cat === 'all' ? lines : lines.filter((l) => l.category === cat);

  return (
    <Layout role="student">
      <header className="mb-5">
        <h1 className="h-title">☎️ હેલ્પલાઇન</h1>
        <p className="muted mt-1">જરૂર પડે ત્યારે તરત કૉલ કરો. નંબર દબાવશો તો ફોન કૉલ થશે.</p>
      </header>

      <div className="mb-4 max-w-3xl">
        <Tabs tabs={CATS} value={cat} onChange={setCat} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => (
          <a key={l.id} href={`tel:${l.number}`}
            className="card card-pad !p-4 transition hover:shadow-lift active:scale-[.99]">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-kiwi text-xl">
                {CAT_ICON[l.category] || '📞'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-brand-900">{l.name_gu}</p>
                <p className="mt-0.5 text-lg font-extrabold tracking-wider text-brand-700">{l.number}</p>
                {l.note_gu && <p className="mt-1 text-xs leading-snug text-brand-800/75">{l.note_gu}</p>}
              </div>
            </div>
            <span className="btn-soft mt-3 w-full py-2">📞 કૉલ કરો</span>
          </a>
        ))}
      </div>

      <div className="card card-pad mt-6 border-gold-200 bg-gold-100/60">
        <p className="h-sub">🛡️ જો તકાલીન જરૂર હોય તો</p>
        <ul className="mt-2 space-y-1.5 text-sm font-semibold leading-relaxed text-brand-800">
          <li>• કોઈ તમને તંગ કરે તો તરત <b>112</b> કે <b>100</b> પર કૉલ કરો.</li>
          <li>• શાળામાં કોઈ વિદ્યાર્થીને રેગિંગ થાય તો શાળાના શિક્ષકને કરો — ગુપતરી રાખવામાં આવશે.</li>
          <li>• બાળકના અત્યાચારની ફરિયાદ <b>1098</b> પર.</li>
          <li>• ઓનલાઈન છેતરવાણી હોય તો <b>1930</b> પર.</li>
        </ul>
      </div>
    </Layout>
  );
}
