import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../components/ui.jsx';
import { apiLogin } from '../api.js';
import { SCHOOL } from '../data/schoolMeta.js';


export default function Login() {
  const [tab, setTab] = useState('student');
  const [rollNo, setRollNo] = useState('');
  const [std, setStd] = useState('9');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [conn, setConn] = useState('checking'); // checking | ok | fail
  const [ver, setVer] = useState('');
  const { login, role } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  // સર્વર સુધી પહોંચાય છે કે નહીં તે તપાસો — એટલે ખોટો વિચાર ન થાય
  useEffect(() => {
    let done = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch('/api/school')
      .then((r) => { if (done) return; setConn(r.ok ? 'ok' : 'fail'); return r.json(); })
      .then((d) => { if (d && d.version) setVer(d.version); })
      .catch(() => { if (!done) setConn('fail'); })
      .finally(() => { clearTimeout(t); done = true; });
    return () => { done = true; ctrl.abort(); };
  }, []);

  // લોગઇન થઈ ગયા પછી અહીંથી બહાર જવું — render વખતે navigate ન કરીએ (React error આવે છે)
  useEffect(() => {
    if (role) navigate(role === 'teacher' ? '/t' : '/s', { replace: true });
  }, [role, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (tab === 'student') {
        const res = await apiLogin('/auth/student', { rollNo, std, password });
        await login(res);
        push(res.welcome || `${res.greeting} તમારું સ્વાગત છે!`, 'success', 6000);
        navigate('/s', { replace: true });
      } else {
        const res = await apiLogin('/auth/teacher', { phone, password });
        await login(res);
        push(res.welcome || `${res.greeting} તમારું સ્વાગત છે!`, 'success', 6000);
        navigate('/t', { replace: true });
      }
    } catch (e) {
      setErr(e.message || 'લોગઇન થઈ શક્યું નહીં.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        {/* બાઁ પાન : પરિચય */}
        <section className="order-2 lg:order-1">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="લોગો" className="h-24 w-24 object-contain drop-shadow" />
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-brand-900 sm:text-3xl">{SCHOOL.nameGu}</h1>
              <p className="text-sm font-semibold text-brand-700">{SCHOOL.nameEn}</p>
              <p className="mt-1 inline-block rounded-full bg-gold-200 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-brand-900">
                Learn · Grow · Serve
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-800">
            <strong className="font-extrabold">ડિજિટલ કેમ્પસ સિસ્ટમ</strong> — વિદ્યાર્થી અને શિક્ષક બંને માટેનું એક જ પોર્ટલ.
            ધોરણ ૯ અને ૧૦ માટે અલગ-અલગ અભ્યાસક્રમ, પરિણામ, શંકા પોર્ટલ, ફરિયાદ, રેગિંગ અને હેલ્પલાઇન — બધું એક જ જગ્યાએ.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['💡', 'શંકા પોર્ટલ', 'Axon + શિક્ષક'],
              ['📚', 'અભ્યાસક્રમ', 'ધોરણ ૯ · ૧૦'],
              ['📊', 'પરિણામ', 'વિષયવાર ગુણ'],
              ['☎️', 'હેલ્પલાઇન', 'તકાલીન મદદ'],
            ].map(([i, t, s]) => (
              <div key={t} className="card card-pad !p-4">
                <div className="text-xl">{i}</div>
                <p className="mt-1 text-sm font-extrabold text-brand-900">{t}</p>
                <p className="text-[11px] font-semibold text-brand-700/70">{s}</p>
              </div>
            ))}
          </div>
        </section>

        {/* જમણ પાન : લોગઇન */}
        <section className="order-1 lg:order-2">
          <div className="card card-pad animate-fade-up">
            <div className="mb-5 flex gap-1.5 rounded-2xl bg-brand-100/80 p-1.5">
              {[['student', '🎒 વિદ્યાર્થી'], ['teacher', '👩‍🏫 શિક્ષક']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => { setTab(v); setErr(''); }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-extrabold transition
                    ${tab === v ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-700 hover:bg-white/60'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {conn === 'checking' && (
              <p className="mb-4 rounded-2xl bg-brand-50 px-4 py-2.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                ⏳ સર્વર સાથે જોડાણ તપાસ થાય છે…
              </p>
            )}
            {conn === 'fail' && (
              <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
                ⚠️ <b>સર્વર સાથે જોડાણ થતું નથી.</b> એટલે લોગઇન અહીંથી કામ કરશે નહીં.
                સાઇટ જૂનું કેડ હોય તો બ્રાઉઝરમાં <b>Ctrl + Shift + R</b> દબાવીને ફરી પ્રયત્ન કરો.
              </p>
            )}

            <form onSubmit={submit} className="space-y-4">
              {tab === 'student' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">ધોરણ</label>
                      <select className="input" value={std} onChange={(e) => setStd(e.target.value)}>
                        <option value="9">ધોરણ ૯</option>
                        <option value="10">ધોરણ ૧૦</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">રોલ નંબર</label>
                      <input
                        className="input" inputMode="numeric" placeholder="દા.ત. 10"
                        value={rollNo} onChange={(e) => setRollNo(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">પાસવર્ડ</label>
                    <input className="input" type="password" placeholder={`student${std}`}
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <p className="mt-1 text-xs text-brand-700/70">
                      તમારો ધોરણ <b>{std}</b> છે — પાસવર્ડ <b>student{std}</b> લખો.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">મોબાઇલ નંબર</label>
                    <input className="input" inputMode="numeric" placeholder="10 અંકનો નંબર"
                      value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                  <div>
                    <label className="label">પાસવર્ડ</label>
                    <input className="input" type="password" placeholder="••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </>
              )}

              {err && (
                <p className="animate-pop rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                  {err}
                </p>
              )}

              <button type="submit" disabled={busy || conn === 'fail'} className="btn-primary w-full py-3 text-base">
                {busy ? 'લોગઇન થાય છે…' : tab === 'student' ? 'ડિજિટલ કેમ્પસમાં જાઓ' : 'શિક્ષક પોર્ટલમાં જાઓ'}
              </button>
            </form>
          </div>

          <p className="mt-3 text-center text-[11px] font-semibold text-brand-700/60">
            {SCHOOL.board} · શૈક્ષણિક વર્ષ {SCHOOL.year} · {SCHOOL.medium}
          </p>
          {ver && (
            <p className="mt-1.5 text-center text-[11px] font-extrabold text-brand-500">
              આપણી કોપી : {ver}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
