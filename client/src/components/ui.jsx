import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api.js';

// ═══════════════════ Auth context ═══════════════════
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, role: null });

  const load = useCallback(async () => {
    // ધ્યાન રાખો : loading ક્યારેય true ન રહી શકે નહીં.
    // getToken() અહીં try ની બહાર કરવાથી કોઈ એક્સેપ્શન આવે તો
    // સ્પિનર અમર માટે ફસી રહે છે — એટલે બધું try/finally ની અંદર.
    try {
      const token = getToken();
      if (!token) {
        setState({ loading: false, user: null, role: null });
        return;
      }
      const me = await api('/auth/me', { retries: 0, timeout: 8000 });
      setState({ loading: false, user: me.student || me.teacher, role: me.role });
    } catch {
      setToken(null);
      setState({ loading: false, user: null, role: null });
    } finally {
      // છેલ્લે ખાતરી : લોડિંગ ક્યારેય ચાલુ ન રહે
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // છેલ્લી સુરક્ષા : કંઈક કારણે load() અટકી ગયું હોય તો પણ
  // ૬ સેકન્ડ પછી લોડિંગ ચૂપચાપ બંધ કરી દેવાય — સ્પિનર ચાલુ ન રહે
  useEffect(() => {
    const t = setTimeout(() => {
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const login = useCallback(async (res) => {
    setToken(res.token);
    setState({ loading: false, user: res.student || res.teacher, role: res.role, greeting: res.greeting, welcome: res.welcome });
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setToken(null);
    setState({ loading: false, user: null, role: null });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout, refresh: load }), [state, login, logout, load]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// ═══════════════════ Toast ═══════════════════
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((p) => [...p, { id, msg, type }]);
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  const styles = {
    success: 'bg-brand-800 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-gold-200 text-brand-900',
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,420px)] space-y-2">
        {items.map((i) => (
          <div key={i.id} className={`animate-pop rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift ${styles[i.type]}`}>
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ═══════════════════ Small UI bits ═══════════════════
export function Spinner({ label = 'લોડ થાય છે…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-brand-700">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-700" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function Empty({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-2xl">{icon || '🌾'}</div>
      <p className="h-sub">{title}</p>
      {hint && <p className="muted mt-1 max-w-md">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone = 'brand', icon }) {
  const tones = {
    brand: 'from-brand-100 to-brand-50 text-brand-800',
    gold: 'from-gold-200 to-gold-100 text-brand-900',
    sky: 'from-sky/60 to-white text-brand-800',
    rose: 'from-rose-100 to-rose-50 text-rose-800',
  };
  return (
    <div className={`card bg-gradient-to-br ${tones[tone]} p-4 sm:p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`animate-pop relative w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-auto
                      rounded-t-3xl sm:rounded-3xl bg-cream shadow-lift`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brand-100 bg-cream/95 px-5 py-4 backdrop-blur">
          <h3 className="h-sub">{title}</h3>
          <button onClick={onClose} className="rounded-xl px-2.5 py-1 text-lg text-brand-700 hover:bg-brand-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-brand-100/70 p-1.5">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition
            ${value === t.value ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-700 hover:bg-white/60'}`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold
              ${value === t.value ? 'bg-brand-700 text-white' : 'bg-brand-200 text-brand-800'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-brand-700/70">{hint}</p>}
    </div>
  );
}

export function LoadingBlock({ text = 'લોડ થાય છે…' }) {
  return <Spinner label={text} />;
}
