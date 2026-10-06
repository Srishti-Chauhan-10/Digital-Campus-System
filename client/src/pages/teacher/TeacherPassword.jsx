import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth, useToast } from '../../components/ui.jsx';
import { api } from '../../api.js';

export default function TeacherPassword() {
  const { user } = useAuth();
  const { push } = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api('/teacher/my-password-status').then(setStatus).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (next !== again) return push('નવો પાસવર્ડ બે વખતે સરખો નથી.', 'error');
    if (next === cur) return push('નવો પાસવર્ડ જૂનાથી સરખો છે.', 'error');
    setBusy(true);
    try {
      const r = await api('/teacher/password', { method: 'POST', body: { current: cur, next } });
      push(r.message || 'પાસવર્ડ સચવાઈ ગયો ✅');
      setCur(''); setNext(''); setAgain('');
      setStatus({ changed: true });
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-lg">
        <h1 className="h-title">🔑 મારો પાસવર્ડ બદલો</h1>
        <p className="muted mt-1">જે નવો પાસવર્ડ તમે અહીં લખશો એ કાયમી રીતે સચવાઈ જશે.</p>

        <div className="card card-pad mt-4">
          <div className="mb-4 rounded-2xl bg-gold-200/50 px-4 py-3 ring-1 ring-gold-200">
            <p className="text-xs font-extrabold text-brand-900">
              👤 {user?.name_gu}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-brand-800">
              {status?.changed
                ? '✅ તમે પોતાનો પાસવર્ડ બદલી ચૂક્કા છો'
                : 'ℹ️ હજુ ડિફોલ્ટ પાસવર્ડ વાપરો છો — નીચેથી બદલો'}
            </p>
          </div>

          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="label">હાલનો પાસવર્ડ</label>
              <input
                className="input" type={show ? 'text' : 'password'} placeholder="હાલનો પાસવર્ડ"
                value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password"
              />
            </div>

            <div>
              <label className="label">નવો પાસવર્ડ</label>
              <input
                className="input" type={show ? 'text' : 'password'} placeholder="ઓછામાં ઓછા 4 અક્ષર"
                value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label">નવો પાસવર્ડ ફરી લખો</label>
              <input
                className="input" type={show ? 'text' : 'password'} placeholder="એક જ પાસવર્ડ"
                value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-brand-800">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              પાસવર્ડ બતાવો
            </label>

            {next && again && next !== again && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                બે પાસવર્ડ સરખા નથી.
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
              {busy ? 'સચવાઈ રહ્યું છે…' : '💾 પાસવર્ડ સચવો'}
            </button>
          </form>
        </div>

        <p className="mt-3 text-center text-[11px] font-semibold text-brand-700/70">
          પાસવર્ડ બદલ્યા પછી આગળથી નવા પાસવર્ડથી જ લોગિન કરવું.
        </p>
      </div>
    </Layout>
  );
}
