import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useToast } from '../../components/ui.jsx';
import { api } from '../../api.js';

function kb(n) {
  return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
}

export default function TeacherBackup() {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/teacher/backups').then(setData).catch((e) => push(e.message, 'error'));

  useEffect(() => { load(); }, []);

  const takeBackup = async () => {
    setBusy(true);
    try {
      const r = await api('/teacher/backup-now', { method: 'POST' });
      push(r.message);
      load();
    } catch (e) {
      push(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout role="teacher">
      <div className="mx-auto max-w-2xl">
        <h1 className="h-title">💾 ડેટા બેકઅપ</h1>
        <p className="muted mt-1">
          વિદ્યાર્થી, ગુણ, પરિણામ અને ફરિયાદનો ડેટા સચવાય છે. આ બેકઅપથી કંઈ પણ ગુમાવાય તો પાછું મેળવી શકાય.
        </p>

        {/* ── ડેટા ક્યાં રહે છે ── */}
        <div className="card card-pad mt-4 border-l-4 border-l-brand-500 bg-brand-50/60">
          <p className="text-sm font-extrabold text-brand-900">📁 ડેટા ક્યાં રહે છે</p>
          <p className="mt-1 break-all rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-brand-800">
            {data?.dataFolder || '…'}
          </p>
          <p className="mt-2 text-xs font-semibold text-brand-800">
            ✅ એપ અપડેટ થાય ત્યારે પણ આ ફોલ્ડર અડગ નથી થતું — તમારો બધો ડેટા અહીં જ રહે છે.
          </p>
        </div>

        {/* ── હવે બેકઅપ લો ── */}
        <div className="card card-pad mt-4">
          <p className="text-sm font-extrabold text-brand-900">🛡️ હવે બેકઅપ લો</p>
          <p className="mt-1 text-xs font-semibold text-brand-700">
            સર્વર ચાલુ કરતાં જ આપોઆપ બેકઅપ લઈ લે છે. મોટા કામ પહેલાં હાથે લઈ લેશો.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={takeBackup} disabled={busy}>
              {busy ? 'લઈ રહ્યું છે…' : '💾 હમણાં બેકઅપ લો'}
            </button>
            <a className="btn-gold" href="/api/teacher/backup-download" download>
              ⬇️ કમ્પ્યુટરમાં ડાઉનલોડ કરો
            </a>
          </div>
        </div>

        {/* ── બેકઅપ યાદી ── */}
        <div className="card card-pad mt-4">
          <p className="text-sm font-extrabold text-brand-900">
            📋 બેકઅપ યાદી ({data?.list?.length || 0})
          </p>
          <p className="mt-1 text-xs font-semibold text-brand-700">છેલ્લા 30 બેકઅપ રાખવામાં આવે છે.</p>

          {!data ? (
            <p className="muted mt-3">લોડ થાય છે…</p>
          ) : data.list.length === 0 ? (
            <p className="muted mt-3">હજુ કોઈ બેકઅપ નથી.</p>
          ) : (
            <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              {data.list.map((b) => (
                <div key={b.file}
                  className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
                  <span className="truncate">{b.file}</span>
                  <span className="ml-3 shrink-0 text-brand-700/70">{kb(b.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] font-semibold text-brand-700/70">
          ટીચરના લોગિન વગર કોઈ બેકઅપ કે ડેટા ફાઇલ જોઈ શકાતી નથી.
        </p>
      </div>
    </Layout>
  );
}
