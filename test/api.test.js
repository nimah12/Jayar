/* ==================== تست خودکار API جایار ==================== */
/* اجرا: npm test  (node --test test/) — سرور در پورت و دیتابیس جداگانه اسپاون میشود */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 5987; /* پورت تست — جدا از پورت اصلی (5871) */
const BASE = `http://localhost:${PORT}`;
const TMP_DB = path.join(os.tmpdir(), `jayar-test-${process.pid}-${Date.now()}.json`);

let server = null;

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['serve.js'], {
      env: { ...process.env, PORT: String(PORT), JAYAR_DB: TMP_DB },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let ready = false;
    child.stdout.on('data', d => {
      if (!ready && String(d).includes('jayar serving')) {
        ready = true;
        resolve(child);
      }
    });
    child.on('exit', code => { if (!ready) reject(new Error('سرور قبل از آمادهشدن بسته شد: ' + code)); });
    child.on('error', reject);
  });
}

async function api(method, pathname, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(BASE + pathname, opts);
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

before(async () => {
  server = await startServer();
});

after(() => {
  if (server) server.kill();
  try { fs.rmSync(TMP_DB, { force: true }); } catch {}
});

/* ---------- دیتابیس و مسیر پایه ---------- */
test('GET /api/bootstrap → خالی است', async () => {
  const r = await api('GET', '/api/bootstrap');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.properties, []);
  assert.deepEqual(r.json.bookings, []);
  assert.deepEqual(r.json.hosts, []);
});

test('GET /api/nope → 404', async () => {
  const r = await api('GET', '/api/nope');
  assert.equal(r.status, 404);
});

/* ---------- اقامتگاهها ---------- */
test('POST /api/properties → 201 و در bootstrap دیده میشود', async () => {
  const r = await api('POST', '/api/properties', { id: 'u1', title: 'ویلا تست', city: 'کیش', price: 1000000 });
  assert.equal(r.status, 201);
  assert.equal(r.json.property.id, 'u1');

  const boot = await api('GET', '/api/bootstrap');
  assert.equal(boot.json.properties.length, 1);
  assert.equal(boot.json.properties[0].title, 'ویلا تست');
});

test('POST /api/properties تکراری → 409', async () => {
  const r = await api('POST', '/api/properties', { id: 'u1', title: 'تکراری', city: 'تهران' });
  assert.equal(r.status, 409);
});

test('POST /api/properties ناقص → 400', async () => {
  const r = await api('POST', '/api/properties', { id: 'x' });
  assert.equal(r.status, 400);
});

test('POST /api/properties با بدنهٔ نامعتبر → 400 (بدون hang)', async () => {
  const r = await api('POST', '/api/properties', 'not-json{');
  assert.equal(r.status, 400);
});

test('PATCH /api/properties/:id → 200 با ادغام داده', async () => {
  const r = await api('PATCH', '/api/properties/u1', { price: 1500000 });
  assert.equal(r.status, 200);
  assert.equal(r.json.property.price, 1500000);
  assert.equal(r.json.property.city, 'کیش'); /* فیلدهای دیگر حفظ شدند */
});

test('PATCH /api/properties/:id ناموجود → 404', async () => {
  const r = await api('PATCH', '/api/properties/nope', { price: 1 });
  assert.equal(r.status, 404);
});

test('DELETE /api/properties/:id → 200 و سپس 404 برای حذف مجدد', async () => {
  const r = await api('DELETE', '/api/properties/u1');
  assert.equal(r.status, 200);
  const again = await api('DELETE', '/api/properties/u1');
  assert.equal(again.status, 404);
});

/* ---------- رزروها ---------- */
test('POST /api/bookings → 201، تکراری → 409، ناقص → 400', async () => {
  const ok = await api('POST', '/api/bookings', { id: 'b1', propertyId: 'v1', status: 'pending' });
  assert.equal(ok.status, 201);

  const dup = await api('POST', '/api/bookings', { id: 'b1', propertyId: 'v1' });
  assert.equal(dup.status, 409);

  const bad = await api('POST', '/api/bookings', { id: 'b2' });
  assert.equal(bad.status, 400);
});

test('PATCH /api/bookings/:id → تغییر وضعیت، ناموجود → 404', async () => {
  const r = await api('PATCH', '/api/bookings/b1', { status: 'ok' });
  assert.equal(r.status, 200);
  assert.equal(r.json.booking.status, 'ok');

  const missing = await api('PATCH', '/api/bookings/nope', { status: 'ok' });
  assert.equal(missing.status, 404);

  const list = await api('GET', '/api/bookings');
  assert.equal(list.json.bookings[0].status, 'ok');
});

/* ---------- میزبان ---------- */
test('POST /api/hosts/login → ساخت حساب، ورود مجدد همان حساب', async () => {
  const first = await api('POST', '/api/hosts/login', { name: 'رضا کریمی', phone: '09123456789' });
  assert.equal(first.status, 200);
  assert.equal(first.json.created, true);

  const second = await api('POST', '/api/hosts/login', { name: 'رضا کریمی', phone: '09123456789' });
  assert.equal(second.json.created, false);
  assert.equal(second.json.host.id, first.json.host.id);
});

test('POST /api/hosts/login نامعتبر → 400', async () => {
  const r = await api('POST', '/api/hosts/login', { name: 'x', phone: '123' });
  assert.equal(r.status, 400);
});

/* ---------- استاتیک و امنیت مسیر ---------- */
test('سرو استاتیک: / → 200', async () => {
  const res = await fetch(BASE + '/');
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes('جایار'));
});

test('path traversal → 403', async () => {
  /* fetch مسیر را نرمال می‌کند؛ پس مسیر خام را مستقیم می‌فرستیم */
  const http = require('node:http');
  const raw = rawPath => new Promise((resolve, reject) => {
    const r = http.request({ host: 'localhost', port: PORT, path: rawPath, method: 'GET' }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    r.on('error', reject);
    r.end();
  });
  assert.equal(await raw('/../package.json'), 403);
  assert.equal(await raw('/%2e%2e/package.json'), 403);
});

/* ---------- همزمانی ---------- */
test('۲۰ نوشتن همزمان اقامتگاه — هیچکدام گم نمیشود', async () => {
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => api('POST', '/api/properties', { id: 'c' + i, title: 'همزمان ' + i, city: 'کیش' }))
  );
  assert.ok(results.every(r => r.status === 201));

  const boot = await api('GET', '/api/bootstrap');
  const cProps = boot.json.properties.filter(p => String(p.id).startsWith('c'));
  assert.equal(cProps.length, 20);
});

test('۱۰ ورود همزمان با یک شماره — فقط ۱ حساب ساخته میشود', async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, () => api('POST', '/api/hosts/login', { name: 'سارا', phone: '09121112222' }))
  );
  const created = results.filter(r => r.json && r.json.created === true);
  assert.equal(created.length, 1);
  assert.equal(new Set(results.map(r => r.json.host.id)).size, 1);
});

test('دادهٔ نهایی روی دیسک ذخیره شده و سالم است', () => {
  const db = JSON.parse(fs.readFileSync(TMP_DB, 'utf8'));
  assert.ok(Array.isArray(db.properties));
  assert.ok(Array.isArray(db.bookings));
  assert.ok(Array.isArray(db.hosts));
  assert.ok(db.hosts.length >= 2);
  assert.equal(fs.existsSync(TMP_DB + '.tmp'), false); /* فایل موقت باقی نمانده */
});
