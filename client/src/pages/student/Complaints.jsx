import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast, Field, Empty, Tabs } from '../../components/ui.jsx';
import { api, fmtDate } from '../../api.js';
import { COMPLAINT_CATEGORIES, STATUS_STYLE } from '../../data/schoolMeta.js';

const HOSTEL_ISSUES = ['ખાવાનું જંગ્લી છે', 'પાણી પૂરતું નથી', 'શૌચાલયની સમસ્યા', 'બેડનો બગડ્યો છે', 'વિદ્યુતિ કે પંખા બંધ', 'કોઈ વિદ્યાર્થી પર હુંશી', 'અન્ય'];
const CAMPUS_ISSUES = ['વર્ગખંડમાં ગંભીર અવાજ', 'શૌચાલય સાફિકટી', 'રમતનું સાધન તૂટેલું', 'પાણીનો ટાંકી બગડેલ', 'લાઇબ્રેરીમાં નુકસાન', 'અન્ય'];
const BULLYING_ISSUES = ['મારખાટ/મારપિટ', 'વચન દોષ કે ઉદ્યામ', 'જાતભેદ કે હેતુ પર આધારિત વાત', 'ખાતરવામાં થયેલ', 'જીવને અસર', 'અન્ય'];

export default function Complaints({ mode = 'general' }) {
  const { push } = useToast();
  const isBully = mode === 'bullying';
  const [tab, setTab] = useState(isBully ? 'bullying' : 'hostel');
  const [issues, setIssues] = useState(isBully ? BULLYING_ISSUES : HOSTEL_ISSUES);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('સામાન્ય');
  const [when, setWhen] = useState('');
  const [who, setWho] = useState('');
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState([]);
  const [done, setDone] = useState(false);

  const load = () => api('/student/complaints').then((r) => setList(r.complaints)).catch(() => {});
  useEffect(() => { load(); }, []);

  const pickTab = (v) => {
    setTab(v);
    setIssues(v === 'hostel' ? HOSTEL_ISSUES : v === 'campus' ? CAMPUS_ISSUES : BULLYING_ISSUES);
    setSubject('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!subject && !details.trim()) return push('ફરિયાદ લખો.', 'error');
    if (details.trim().length < (tab === 'bullying' ? 20 : 10)) {
      return push(tab === 'bullying' ? 'રેગિંગની વિગત વધુ લખો (ઓછામાં ઓછા 20 અક્ષર).' : 'વિગત ઓછામાં ઓછા 10 અક્ષરની લખો.', 'error');
    }
    setBusy(true);
    try {
      const extra = tab === 'bullying' ? `\n\n[ક્યારે] ${when || 'કર્યું નથી'}\n[કોણ] ${who || 'ખબર નથી'}` : '';
      await api('/student/complaint', {
        method: 'POST',
        body: {
          category: tab,
          subject: subject || null,
          details: details.trim() + extra,
          location,
          severity: tab === 'bullying' ? 'અસરકારક' : severity,
        },
      });
      push('તમારી ફરિયાદ નોંધાઈ ગઈ છે. શિક્ષક તરત જ તપાસ કરશે.');
      setSubject(''); setDetails(''); setLocation(''); setWhen(''); setWho('');
      setDone(true);
      load();
    } catch (e2) {
      push(e2.message, 'error');
    } finally { setBusy(false); }
  };

  const filtered = list.filter((c) => (isBully ? c.category === 'bullying' : c.category !== 'bullying'));

  return (
    <Layout role="student">
      <header className="mb-5">
        <h1 className="h-title">{isBully ? '🛡️ રેગિંગ ફરિયાદ' : '📝 ફરિયાદ'}</h1>
        <p className="muted mt-1">
          {isBully
            ? 'કોઈ તમને તંગ કરે, હેતુ પર આધારિત કહે, ખાતરવામાં આવે તો અહીં લખો. તમારું નામ કોઈને જણ નથી થતું.'
            : 'ભવન (હોસ્ટેલ) અથવા કેમ્પસની સમસ્યા અહીં નોંધાવો.'}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className={`card card-pad ${isBully ? 'border-rose-200' : ''}`}>
          {!isBully && (
            <div className="mb-4">
              <Tabs
                value={tab}
                onChange={pickTab}
                tabs={[
                  { value: 'hostel', label: '🏠 ભવન / હોસ્ટેલ' },
                  { value: 'campus', label: '🏫 કેમ્પસ' },
                ]}
              />
            </div>
          )}
          {isBully && (
            <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
              🔒 ગુપત ફરિયાદ — ફક્ત વિદ્યાર્થી સાથે જ નહીં, શિક્ષક પણ જોઈ શકે છે. જરૂર હોય તો હેલ્પલાઇનનો પણ ઉપયોગ કરી શકો.
            </div>
          )}

          <div className="space-y-3.5">
            <Field label="કયું મુદ્દો છે?">
              <div className="flex flex-wrap gap-1.5">
                {issues.map((i) => (
                  <button key={i} type="button" onClick={() => setSubject(i)}
                    className={`chip ${subject === i ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-800 hover:bg-brand-200'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </Field>

            {isBully && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="ક્યારે થયું?">
                  <input className="input" placeholder="દા.ત. આજે સવારે, ગલ અઠવાડિયે" value={when} onChange={(e) => setWhen(e.target.value)} />
                </Field>
                <Field label="કોણ? (જો ખબર હોય તો)">
                  <input className="input" placeholder="નામ કે વર્ણન" value={who} onChange={(e) => setWho(e.target.value)} />
                </Field>
              </div>
            )}

            {!isBully && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="ક્યાં?" hint="દા.ત. રસોડું, ખેલનું મેદાન, બ્લોક નં. ૩">
                  <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
                </Field>
                <Field label="કેટલી અસરકારક છે?">
                  <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option>સામાન્ય</option>
                    <option>વધુ</option>
                    <option>ખૂબ વધુ</option>
                  </select>
                </Field>
              </div>
            )}

            <Field label="વિગત" hint={isBully ? 'ક્યાં, ક્યારે, શું થયું — જેટલું વિગત આવશે તેટલું ઝડપી કાર્યવાહી થશે.' : 'સમસ્યા વિશે લખો.'}>
              <textarea className="input min-h-[120px] resize-y" value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={isBully ? 'ઉદાહરણ : વર્ગખંડમાં માર્ગે ગયા ત્યારે…' : 'ઉદાહરણ : ભવનમાં પાણી ત્રણ દિવસથી આવતું નથી…'} />
            </Field>

            {done && (
              <p className="animate-pop rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-200">
                ✅ ફરિયાદ નોંધાઈ ગઈ છે. નીચે તમારી ફરિયાદની યાદી જુઓ.
              </p>
            )}

            <button type="submit" disabled={busy} className={`w-full py-3 text-base ${isBully ? 'btn-danger' : 'btn-primary'}`}>
              {busy ? 'મોકલાય છે…' : isBully ? 'ગુપત રીતે ફરિયાદ કરો' : 'ફરિયાદ મોકલો'}
            </button>
          </div>
        </form>

        <div className="card">
          <div className="border-b border-brand-100 px-5 py-4">
            <h2 className="h-sub">{isBully ? 'મારી રેગિંગ ફરિયાદ' : 'મારી ફરિયાદ'}</h2>
          </div>
          {filtered.length === 0 ? (
            <Empty icon={isBully ? '🛡️' : '📝'} title="હજુ કોઈ ફરિયાદ નથી"
              hint={isBully ? 'ફરિયાદ કરો તો અહીં તેની સ્થિતિ દેખાશે.' : 'સમસ્યા કરો તો અહીં તેની સ્થિતિ દેખાશે.'} />
          ) : (
            <ul className="divide-y divide-brand-100">
              {filtered.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-brand-100 text-brand-800">
                      {COMPLAINT_CATEGORIES.find((x) => x.value === c.category)?.icon}{' '}
                      {COMPLAINT_CATEGORIES.find((x) => x.value === c.category)?.short}
                    </span>
                    <span className={`chip ${STATUS_STYLE[c.status] || 'bg-brand-100 text-brand-800'}`}>{c.status}</span>
                    <span className="text-[11px] font-semibold text-brand-700/60">{fmtDate(c.created_at)}</span>
                  </div>
                  {c.subject && <p className="mt-2 text-sm font-extrabold text-brand-900">{c.subject}</p>}
                  <p className="pre-line mt-1 line-clamp-4 text-sm leading-relaxed text-brand-800/85">{c.details}</p>
                  {c.note && (
                    <p className="mt-2 rounded-xl bg-gold-100 px-3 py-2 text-xs font-semibold text-brand-900">
                      🗨️ શિક્ષક : {c.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
