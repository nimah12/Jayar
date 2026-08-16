/* جایار — بازتولید تگ‌های SEO (canonical / og:url / og:image) از site.config.js
   اجرا: npm run build:meta

   بعد از تغییر SITE_URL در site.config.js، این اسکریپت را اجرا کنید تا دامنهٔ
   جدید در همهٔ صفحات بازنویسی شود. اجرای دوباره بدون تغییر، بی‌اثر است (idempotent).
   تگ‌ها استاتیک در HTML می‌مانند (بهترین حالت برای خزنده‌ها و پیش‌نمایش شبکه‌های اجتماعی). */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { SITE_URL } = require(path.join(ROOT, 'site.config.js'));

const PAGES = [
  'index.html', 'detail.html', 'host.html', 'favorites.html',
  'about.html', 'about-us.html', 'faq.html', 'rules.html',
];

if (!SITE_URL || !/^https?:\/\/[^/\s]+$/.test(SITE_URL)) {
  console.error('❌ site.config.js: مقدار SITE_URL نامعتبر است — نمونه: https://jayar.ir');
  process.exit(1);
}

const base = SITE_URL.replace(/\/+$/, ''); /* بدون اسلش انتهایی */

let changed = 0;
let skipped = 0;
for (const name of PAGES) {
  const file = path.join(ROOT, name);
  let html;
  try {
    html = fs.readFileSync(file, 'utf8');
  } catch {
    console.error(`⚠️  ${name}: فایل پیدا نشد — رد شد`);
    skipped++;
    continue;
  }

  /* فقط صفحاتی که بلوک SEO کامل دارند بازنویسی می‌شوند */
  const hasCanonical = /rel="canonical" href="https?:\/\//.test(html);
  const hasOgUrl = /property="og:url" content="https?:\/\//.test(html);
  if (!hasCanonical || !hasOgUrl) {
    console.error(`⚠️  ${name}: تگ canonical یا og:url پیدا نشد — رد شد`);
    skipped++;
    continue;
  }

  /* دامنهٔ قبلی از canonical فعلی خوانده می‌شود؛ همهٔ رخدادهای آن
     (canonical، og:url، og:image) با دامنهٔ جدید جایگزین می‌شوند */
  const m = html.match(/rel="canonical" href="(https?:\/\/[^/]+)\//);
  const old = m && m[1];
  if (old && old !== base) {
    fs.writeFileSync(file, html.split(old).join(base));
    changed++;
    console.log(`✏️  ${name}: ${old} → ${base}`);
  } else {
    console.log(`·   ${name}: هماهنگ است`);
  }
}

if (changed) {
  console.log(`✅ ${changed} صفحه با دامنهٔ ${base} بازنویسی شد${skipped ? ` (${skipped} صفحه رد شد)` : ''}`);
} else {
  console.log(`✅ هیچ تغییری لازم نبود — هر ${PAGES.length - skipped} صفحه با ${base} هماهنگ‌اند`);
}
