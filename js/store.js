/* جایار — لایه ذخیره‌سازی روی localStorage */

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

J.db = {
  get props() { return read(KEYS.props, []); },
  set props(v) { write(KEYS.props, v); },
  get bookings() { return read(KEYS.bookings, []); },
  set bookings(v) { write(KEYS.bookings, v); },
  get host() { return read(KEYS.host, null); },
  set host(v) { write(KEYS.host, v); },
  get hosts() { return read(KEYS.hosts, []); },
  set hosts(v) { write(KEYS.hosts, v); },
  get favs() { return read(KEYS.favs, []); },
  set favs(v) { write(KEYS.favs, v); },
  get search() { return read(KEYS.search, null); },
  set search(v) { write(KEYS.search, v); },
};

/* کل پایگاه: داده‌های نمونه + اقامتگاه‌های ثبت‌شده توسط میزبان */
J.getProperties = () => [...J.BASE_PROPERTIES, ...J.db.props];
J.getProperty = id => J.getProperties().find(p => String(p.id) === String(id));

J.addBooking = b => { J.db.bookings = [...J.db.bookings, b]; };
J.updateBookingStatus = (id, status) => {
  J.db.bookings = J.db.bookings.map(b => (b.id === id ? { ...b, status } : b));
};

J.nightsBetween = (a, b) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  const n = Math.round(ms / 86400000);
  return n > 0 ? n : 0;
};

J.uid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
J.uidProp = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);