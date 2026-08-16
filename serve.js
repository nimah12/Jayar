/* جایار — سرور محلی: سرو فایل‌های استاتیک + API ساده (ذخیره در data/db.json) */
/* با node serve.js اجرا می‌شود — بدون وابستگی خارجی
   نوشتن db.json با قفل (صف) و به‌صورت اتمی انجام می‌شود تا درخواست‌های هم‌زمان دیتا را از بین نبرند. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5871;
const DB_FILE = process.env.JAYAR_DB ? path.resolve(process.env.JAYAR_DB) : path.join(ROOT, 'data', 'db.json');

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/* ---------- ذخیره‌سازی (فایل JSON) ---------- */
function loadDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    return {
      properties: Array.isArray(db.properties) ? db.properties : [],
      bookings: Array.isArray(db.bookings) ? db.bookings : [],
      hosts: Array.isArray(db.hosts) ? db.hosts : [],
    };
  } catch {
    return { properties: [], bookings: [], hosts: [] };
  }
}

/* نوشتن اتمی: ابتدا فایل موقت، سپس rename — خواننده‌ها همیشه نسخهٔ کامل فایل را می‌بینند */
function saveDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/* قفل نوشتن: همهٔ عملیات read-modify-write پشت‌سرهم اجرا می‌شوند */
let writeQueue = Promise.resolve();
function withLock(fn) {
  const run = writeQueue.then(() => fn());
  writeQueue = run.then(() => {}, () => {}); /* خطای یک عملیات نباید صف را بشکند */
  return run;
}

/* ---------- API ---------- */
/* بدنهٔ درخواست؛ در صورت خطا/سایز زیاد، null برمی‌گرداند (هرگز معلق نمی‌ماند) */
function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    let done = false;
    const finish = v => { if (!done) { done = true; resolve(v); } };
    req.on('data', chunk => {
      if (done) return;
      data += chunk;
      if (data.length > 1e6) { req.destroy(); finish(null); } /* محدودیت ۱ مگابایت */
    });
    req.on('end', () => {
      let parsed = {};
      try { parsed = data ? JSON.parse(data) : {}; }
      catch { parsed = null; }
      finish(parsed);
    });
    req.on('error', () => finish(null));
    req.on('close', () => finish(null));
  });
}

async function handleApi(req, res, pathname) {
  const method = req.method;
  const parts = pathname.split('/').filter(Boolean); /* ['api', sub, id?] */
  const sub = parts[1];
  const id = parts[2];
  const db = loadDB();

  const send = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  try {
    /* همهٔ داده‌ها در یک درخواست */
    if (method === 'GET' && pathname === '/api/bootstrap') return send(200, db);

    /* ---------- اقامتگاه‌های میزبان‌ها ---------- */
    if (method === 'GET' && pathname === '/api/properties') return send(200, { properties: db.properties });

    if (method === 'POST' && pathname === '/api/properties') {
      return withLock(async () => {
        const body = await readBody(req);
        if (!body || !body.id || !body.title || !body.city) return send(400, { error: 'فیلدهای اجباری (id، title، city) ناقص‌اند' });
        const db = loadDB();
        if (db.properties.some(p => p.id === body.id)) return send(409, { error: 'اقامتگاه با این شناسه قبلاً ثبت شده است' });
        db.properties.push(body);
        saveDB(db);
        return send(201, { property: body });
      });
    }

    if (method === 'PATCH' && sub === 'properties' && id) {
      return withLock(async () => {
        const body = await readBody(req);
        if (!body) return send(400, { error: 'بدنهٔ درخواست نامعتبر است' });
        const db = loadDB();
        const idx = db.properties.findIndex(p => String(p.id) === String(id));
        if (idx === -1) return send(404, { error: 'اقامتگاه پیدا نشد' });
        db.properties[idx] = { ...db.properties[idx], ...body };
        saveDB(db);
        return send(200, { property: db.properties[idx] });
      });
    }

    if (method === 'DELETE' && sub === 'properties' && id) {
      return withLock(async () => {
        const db = loadDB();
        const before = db.properties.length;
        db.properties = db.properties.filter(p => String(p.id) !== String(id));
        if (db.properties.length === before) return send(404, { error: 'اقامتگاه پیدا نشد' });
        saveDB(db);
        return send(200, { ok: true });
      });
    }

    /* ---------- رزروها ---------- */
    if (method === 'GET' && pathname === '/api/bookings') return send(200, { bookings: db.bookings });

    if (method === 'POST' && pathname === '/api/bookings') {
      return withLock(async () => {
        const body = await readBody(req);
        if (!body || !body.id || !body.propertyId) return send(400, { error: 'فیلدهای اجباری (id، propertyId) ناقص‌اند' });
        const db = loadDB();
        if (db.bookings.some(b => b.id === body.id)) return send(409, { error: 'رزرو با این شناسه قبلاً ثبت شده است' });
        db.bookings.push(body);
        saveDB(db);
        return send(201, { booking: body });
      });
    }

    if (method === 'PATCH' && sub === 'bookings' && id) {
      return withLock(async () => {
        const body = await readBody(req);
        if (!body) return send(400, { error: 'بدنهٔ درخواست نامعتبر است' });
        const db = loadDB();
        const booking = db.bookings.find(b => String(b.id) === String(id));
        if (!booking) return send(404, { error: 'رزرو پیدا نشد' });
        Object.assign(booking, body);
        saveDB(db);
        return send(200, { booking });
      });
    }

    /* ---------- ورود/ثبت‌نام میزبان ---------- */
    if (method === 'POST' && pathname === '/api/hosts/login') {
      return withLock(async () => {
        const body = await readBody(req);
        const phone = String((body && body.phone) || '').replace(/[\s-]/g, '');
        const name = String((body && body.name) || '').trim();
        if (!name || name.length < 3 || !/^0\d{10}$/.test(phone)) {
          return send(400, { error: 'نام و شمارهٔ تماس معتبر وارد کنید' });
        }
        const db = loadDB();
        let host = db.hosts.find(h => h.phone === phone);
        let created = false;
        if (!host) {
          host = { id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, phone, since: new Date().toISOString() };
          db.hosts.push(host);
          created = true;
          saveDB(db);
        }
        return send(200, { host, created });
      });
    }

    return send(404, { error: 'مسیر API پیدا نشد' });
  } catch (e) {
    return send(400, { error: e.message });
  }
}

/* ---------- فایل استاتیک ---------- */
function serveStatic(res, pathname) {
  let p;
  try { p = decodeURIComponent(pathname); }
  catch { res.writeHead(400); res.end('bad request'); return; }
  if (p === '/') p = '/index.html';

  const file = path.join(ROOT, p);
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  fs.readFile(file, (e, data) => {
    if (e) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ---------- سرور ---------- */
http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];

  if (pathname.startsWith('/api')) {
    handleApi(req, res, pathname).catch(() => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'خطای داخلی سرور' }));
    });
    return;
  }

  if (req.method !== 'GET') { res.writeHead(405); res.end('method not allowed'); return; }
  serveStatic(res, pathname);
}).listen(PORT, () => console.log('jayar serving on http://localhost:' + PORT + ' (API: /api)'));
