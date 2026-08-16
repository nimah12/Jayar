/* جایار — لایه ذخیره‌سازی: آفلاین (localStorage) + آنلاین (سرور /api) */
/* وقتی سرور در دسترس است، اقامتگاه‌ها، رزروها و میزبان‌ها بین دستگاه‌ها مشترک می‌شوند.
   در صورت نبود سرور، به‌صورت خودکار روی localStorage (رفتار قبلی) کار می‌کند. */

const KEYS = {
  props: 'jayar_properties',
  bookings: 'jayar_bookings',
  host: 'jayar_host',
  hosts: 'jayar_hosts',
  favs: 'jayar_favs',
  search: 'jayar_search',
};

function read(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const API = '/api';

let online = false;    /* حالت داده: سرور-پشتیبان یا محلی (بعد از بوت‌استرپ اولیه) */
let connected = false; /* وضعیت لحظه‌ای اتصال (برای نشانگر فوتر) */
const cache = { props: [], bookings: [], hosts: [] };

/* درخواست به سرور؛ در صورت هر خطا یا عدم پاسخ، null برمی‌گرداند */
async function api(path, opts = {}, timeout = 4000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
  try {
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    if (t) clearTimeout(t);
  }
}

function syncFail() {
  console.warn('jayar: همگام‌سازی با سرور ناموفق بود');
  try { J.toast('خطا در همگام‌سازی با سرور', 'error'); } catch {}
}

J.db = {
  ready: null,

  /* --- اقامتگاه‌های ثبت‌شده توسط میزبان‌ها --- */
  get props() { return online ? cache.props : read(KEYS.props, []); },
  set props(v) {
    if (!online) { write(KEYS.props, v); return; }
    const prev = cache.props;
    cache.props = v;
    const prevIds = new Set(prev.map(p => String(p.id)));
    const nextIds = new Set(v.map(p => String(p.id)));
    const sync = r => { if (!r) syncFail(); };
    for (const p of v) {
      const id = String(p.id);
      if (!prevIds.has(id)) {
        api('/properties', { method: 'POST', body: p }).then(sync);
      } else {
        const old = prev.find(x => String(x.id) === id);
        if (old && JSON.stringify(old) !== JSON.stringify(p)) {
          api('/properties/' + encodeURIComponent(id), { method: 'PATCH', body: p }).then(sync);
        }
      }
    }
    for (const id of prevIds) if (!nextIds.has(id)) api('/properties/' + encodeURIComponent(id), { method: 'DELETE' }).then(sync);
  },

  /* --- رزروها --- */
  get bookings() { return online ? cache.bookings : read(KEYS.bookings, []); },
  set bookings(v) {
    if (!online) { write(KEYS.bookings, v); return; }
    cache.bookings = v;
  },

  /* --- میزبانِ واردشدهٔ فعلی (نشست مخصوص همین دستگاه) --- */
  get host() { return read(KEYS.host, null); },
  set host(v) { write(KEYS.host, v); },

  /* --- حساب‌های میزبان (سرور؛ آفلاین: محلی) --- */
  get hosts() { return online ? cache.hosts : read(KEYS.hosts, []); },
  set hosts(v) {
    if (!online) { write(KEYS.hosts, v); return; }
    cache.hosts = v;
  },

  /* --- علاقه‌مندی‌ها و جستجو: مخصوص هر دستگاه، همیشه محلی --- */
  get favs() { return read(KEYS.favs, []); },
  set favs(v) { write(KEYS.favs, v); },
  get search() { return read(KEYS.search, null); },
  set search(v) { write(KEYS.search, v); },
};

/* ورود/ثبت‌نام میزبان — در حالت آنلاین روی سرور (مشترک بین دستگاه‌ها) انجام می‌شود */
J.loginHost = async (name, phone) => {
  if (online) {
    const res = await api('/hosts/login', { method: 'POST', body: { name, phone } });
    if (res && res.host) return { host: res.host, created: !!res.created };
  }
  /* آفلاین یا خطای سرور: مثل قبل روی localStorage */
  const acc = read(KEYS.hosts, []).find(h => h.phone === phone);
  if (acc) return { host: acc, created: false };
  const fresh = { id: 'h' + Date.now().toString(36), name, phone, since: new Date().toISOString() };
  write(KEYS.hosts, [...read(KEYS.hosts, []), fresh]);
  return { host: fresh, created: true };
};

/* کل پایگاه: داده‌های نمونه + اقامتگاه‌های ثبت‌شده توسط میزبان */
J.getProperties = () => [...J.BASE_PROPERTIES, ...J.db.props];
J.getProperty = id => J.getProperties().find(p => String(p.id) === String(id));

J.addBooking = b => {
  J.db.bookings = [...J.db.bookings, b];
  if (online) api('/bookings', { method: 'POST', body: b }).then(r => { if (!r) syncFail(); });
};

J.updateBookingStatus = (id, status) => {
  J.db.bookings = J.db.bookings.map(b => (b.id === id ? { ...b, status } : b));
  if (online) api('/bookings/' + encodeURIComponent(id), { method: 'PATCH', body: { status } }).then(r => { if (!r) syncFail(); });
};

J.nightsBetween = (a, b) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  const n = Math.round(ms / 86400000);
  return n > 0 ? n : 0;
};

J.uid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
J.uidProp = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* بررسی اتصال به سرور؛ first=بوت‌استرپ داده، وگرنه فقط وضعیت نمایشی */
async function probe(first = false) {
  const data = await api('/bootstrap');
  const ok = !!data;
  if (first && data) {
    online = true;
    cache.props = Array.isArray(data.properties) ? data.properties : [];
    cache.bookings = Array.isArray(data.bookings) ? data.bookings : [];
    cache.hosts = Array.isArray(data.hosts) ? data.hosts : [];
  }
  connected = ok;
  J.emitStatus(ok);
  return ok;
}

J.db.isConnected = () => connected;
J.db.isOnline = () => online;

/* کلیک روی نشانگر: بررسی دوباره؛ اگر سرور برگشته، صفحه را بارگذاری دوباره می‌کند تا حالت مشترک فعال شود */
J.checkConnection = async () => {
  const ok = await probe(false);
  if (ok && !online) location.reload();
  if (!ok) {
    console.warn('jayar: سرور در دسترس نیست');
    try { J.toast('سرور در دسترس نیست — داده‌ها محلی ذخیره می‌شوند', 'error'); } catch {}
  }
  return ok;
};

/* بارگذاری اولیه + بررسی دوره‌ای اتصال (هر ۲۰ ثانیه) */
J.db.ready = probe(true);
setInterval(() => probe(false), 20000);
