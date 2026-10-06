const TOKEN_KEY = 'dcs_token';

// ─────────────────────────────────────────────────────────────
// સુરક્ષિત ટોકન સંગ્રહ
// કેટલીક બ્રાઉઝર/પ્રિવ્યુમાં localStorage બંધ હોય તો તે સીધું
// એક્સેપ્શન નીકાળે છે. એના કારણે લોગઇન "લોડ થાય છે" આવી રહે છે.
// એટલે અહીં try/catch + મેમોરી ફોલબેક રાખ્યું છે.
// ─────────────────────────────────────────────────────────────
let memToken = null;

function safeStorage(action, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    return action(localStorage);
  } catch {
    return fallback;
  }
}

export const getToken = () => safeStorage((s) => s.getItem(TOKEN_KEY), memToken);

export const setToken = (t) => {
  memToken = t || null;
  safeStorage((s) => (t ? s.setItem(TOKEN_KEY, t) : s.removeItem(TOKEN_KEY)), null);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(path, { method = 'GET', body, auth = true, retries = 2, timeout = 15000 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (auth && t) headers.Authorization = `Bearer ${t}`;

  let res = null;
  let data = {};
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // AbortController : જો સર્વર જવાબ ન આપે તો અંતે અટકી ન રહે
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers,
        signal: controller.signal,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      clearTimeout(timer);
      break;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }

  if (!res) {
    const timedOut = lastError && lastError.name === 'AbortError';
    throw new Error(
      timedOut
        ? 'સર્વરનો જવાબ આવતો નથી. ફરી પ્રયત્ન કરો.'
        : 'સર્વર સાથે જોડાણ ન થઈ શક્યું. ઇન્ટરનેટ ચેક કરો.'
    );
  }

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `કંઈક ખોટું થયું (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// લોગઇન માટે ખાસ : ભૂલ આવે તો વારંવાર ફરી પ્રયત્ન
export async function apiLogin(path, body) {
  return api(path, { method: 'POST', body, auth: false, retries: 2, timeout: 20000 });
}

export const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('gu-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtTime = (s) => {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
};
