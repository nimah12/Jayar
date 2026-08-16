/* جایار — توابع مشترک، ثابت‌ها و حالت نمایش */
window.J = window.J || {};
const J = window.J;

J.$  = (sel, ctx = document) => ctx.querySelector(sel);
J.$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

J.escape = (str = '') =>
  String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

J.fmtNum = n => (Number(n) || 0).toLocaleString('fa-IR');

J.fmtPrice = n => `${J.fmtNum(n)} تومان`;

J.fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* آیکون‌های Lucide — کتابخانه به‌صورت محلی (js/vendor/lucide.min.js) و بدون اینترنت
   J.ico(name): مارک‌آپ placeholder که lucide با SVG جایگزین می‌کند
   J.refreshIcons(): بعد از هر رندر داینامیک صدا زده می‌شود (idempotent) */
J.ico = name => `<i class="ico" data-lucide="${name}"></i>`;
J.refreshIcons = (root = document) => {
  if (!window.lucide || typeof lucide.createIcons !== 'function') return;
  try { lucide.createIcons({}, root); } catch { /* هرگز اجرای صفحه را نشکند */ }
};

J.TYPES = {
  hotel: { label: 'هتل', icon: 'Hotel' },
  villa: { label: 'ویلا', icon: 'Home' },
  suite: { label: 'سوئیت', icon: 'Sparkles' },
  apartment: { label: 'اقامتگاه', icon: 'Building2' },
};

J.FEATURES = {
  wifi: 'وای‌فای رایگان', parking: 'پارکینگ', tv: 'تلویزیون', breakfast: 'صبحانه',
  kitchen: 'آشپزخانه', aircon: 'تهویه مطبوع', washing: 'لباسشویی',
  coffee: 'قهوه‌ساز', jacuzzi: 'جکوزی', pool: 'استخر', gym: 'سالن ورزش',
  park: 'فضای سبز', bbq: 'باربیکیو', restaurant: 'رستوران', sea: 'نمای دریا',
  mountain: 'نمای کوه', balcony: 'بالکن',
};

J.cityTitle = city => city || 'همه ایران';

J.FICON = {
  wifi: 'Wifi', parking: 'SquareParking', tv: 'Tv', breakfast: 'Croissant', kitchen: 'CookingPot', aircon: 'Snowflake',
  washing: 'ShoppingBasket', coffee: 'Coffee', jacuzzi: 'Bath', pool: 'Waves', gym: 'Dumbbell', park: 'TreePine',
  bbq: 'Flame', restaurant: 'Utensils', sea: 'Waves', mountain: 'Mountain', balcony: 'Armchair',
};
J.feat = k => `${J.ico(J.FICON[k] || 'sparkle')} ${J.FEATURES[k] || k}`;

/* کارت اقامتگاه — مشترک بین صفحهٔ اصلی و علاقه‌مندی‌ها */
J.cardHTML = (p, idx = 0) => {
  const t = J.TYPES[p.type];
  const isFav = J.db.favs.includes(p.id);
  const feats = (p.features || []).slice(0, 3).map(f => J.feat(f)).join(' · ');
  const delay = Math.min(((idx % 9) + 1), 9);
  return `
  <article class="property group animate-fade-up delay-${delay} transition-all duration-300 hover:-translate-y-2 hover:shadow-sm">
    <div class="property-img">
      <a class="img-link" href="detail.html?id=${p.id}">
        <img src="${J.img(p.id, 900, 600)}" alt="${J.escape(p.title)}" loading="lazy" class="transition-transform duration-500 group-hover:scale-105">
      </a>
      <span class="rating-badge">${J.ico('star')} ${J.fmtNum(p.rating)}</span>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${p.id}" title="علاقه‌مندی">${J.ico('heart')}</button>
      <span class="type-badge">${J.ico(t.icon)} ${t.label}</span>
    </div>
    <div class="property-body">
      <div>
        <a class="property-title transition-colors duration-200 group-hover:text-emerald-700" href="detail.html?id=${p.id}">${J.escape(p.title)}</a>
        <div class="property-loc">${J.ico('map-pin')} ${J.escape(p.city)}${p.region ? '، ' + J.escape(p.region) : ''}</div>
      </div>
      <div class="property-feats">${feats}</div>
      <div class="property-foot">
        <div class="price">
          <span class="price-amount">${J.fmtNum(p.price)}</span>
          <span class="price-unit">تومان / شب</span>
        </div>
        <a class="btn btn-primary btn-sm" href="detail.html?id=${p.id}">رزرو</a>
      </div>
    </div>
  </article>`;
};

/* آمار زندهٔ «جایار در یک نگاه» — مشترک بین صفحات معرفی (about / about-us) */
J.renderStats = (sel = '#stats') => {
  const el = J.$(sel);
  if (!el) return;
  const stats = [
    ['home', J.BASE_PROPERTIES.length, 'اقامتگاه نمونه'],
    ['map', J.CITIES.length, 'شهر مقصد'],
    ['sparkles', Object.keys(J.TYPES).length, 'نوع اقامتگاه'],
  ];
  el.innerHTML = stats.map(([icon, n, label]) => `
    <div class="card" style="text-align:center;padding:20px">
      <div style="font-size:30px">${J.ico(icon)}</div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-dark);margin-top:6px">${J.fmtNum(n)}</div>
      <div class="muted" style="font-size:13px">${label}</div>
    </div>`).join('');
  J.refreshIcons();
};

/* شمارش بازدید اقامتگاه — برای آمار «پربازدیدترین‌ها» در پنل میزبان */
J.recordView = id => {
  const props = J.db.props;
  const hostProp = props.find(x => String(x.id) === String(id));
  if (hostProp) {
    hostProp.views = (hostProp.views || 0) + 1;
    J.db.props = [...props]; /* آفلاین: ذخیره؛ آنلاین: diff → PATCH */
    return;
  }
  const base = J.BASE_PROPERTIES.find(x => String(x.id) === String(id));
  if (base) base.views = (base.views || 0) + 1; /* فقط در حافظهٔ این نشست */
};

J.toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
J.todayISO = () => J.toISO(new Date());

/* محدودیت تاریخ: ورود از امروز به بعد، خروج حداقل یک روز بعد از ورود (برای فیلدهای type=date) */
J.clampDates = (inEl, outEl) => {
  const today = J.todayISO();
  if (inEl.value && inEl.value < today) inEl.value = today;
  const minOut = inEl.value
    ? J.toISO(new Date(new Date(inEl.value).getTime() + 86400000))
    : today;
  outEl.min = minOut;
  if (outEl.value && outEl.value < minOut) outEl.value = minOut;
};

J.toast = (msg, type = 'success') => {
  let wrap = J.$('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = (type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : '') + msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(12px)';
    setTimeout(() => t.remove(), 320);
  }, 3200);
};

J.confirm = (title, desc, icon = 'circle-help', okText = 'تایید') =>
  new Promise(resolve => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal">
        <div class="emoji">${J.ico(icon)}</div>
        <h3>${J.escape(title)}</h3>
        <p>${J.escape(desc)}</p>
        <div class="modal-actions">
          <button class="btn btn-soft" data-act="no">انصراف</button>
          <button class="btn btn-primary" data-act="yes">${okText}</button>
        </div>
      </div>`;
    const close = v => { back.remove(); resolve(v); };
    J.$('[data-act="yes"]', back).onclick = () => close(true);
    J.$('[data-act="no"]', back).onclick = () => close(false);
    back.onclick = e => { if (e.target === back) close(false); };
    document.body.appendChild(back);
    J.refreshIcons();
  });

J.initTheme = () => {
  let stored = null;
  try { stored = localStorage.getItem('jayar_theme'); } catch {}
  const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  const btn = J.$('.theme-toggle');
  const sync = () => {
    if (!btn) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = J.ico(dark ? 'sun' : 'moon');
    J.refreshIcons();
  };
  sync();
  if (btn) btn.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('jayar_theme', isDark ? 'light' : 'dark'); } catch {}
    sync();
  };
};

/* اجرای فوری پس از DOM — بدون انتظار برای داده (مناسب کارهای صرفاً UI مثل تم، منو و آیکون‌ها) */
J.domReady = fn => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* اجرا پس از آماده‌شدن DOM و لایهٔ داده (J.db.ready) — برای رندر محتوا */
J.onReady = fn => {
  const run = () => Promise.resolve(J.db && J.db.ready).then(() => fn());
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
};

/* ---------- نشانگر وضعیت اتصال (فوتر همهٔ صفحات) ---------- */
J.statusCbs = [];
J.onStatusChange = cb => J.statusCbs.push(cb);
J.emitStatus = v => J.statusCbs.forEach(cb => { try { cb(v); } catch {} });

J.onStatusChange(connected => {
  const el = J.$('#connStatus');
  if (!el) return;
  el.classList.toggle('on', !!connected);
  el.classList.toggle('off', !connected);
  el.innerHTML = connected
    ? '<span class="conn-dot on"></span> متصل به سرور — داده‌ها بین دستگاه‌ها مشترک'
    : '<span class="conn-dot off"></span> آفلاین — داده‌ها فقط در این دستگاه';
});

document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('#connStatus');
  if (el && J.checkConnection) J.checkConnection();
});

J.domReady(J.initTheme);

/* ---------- منوی موبایل (همبرگری) ---------- */
J.domReady(() => {
  const burger = J.$('.nav-burger');
  const links = J.$('.nav-links');
  const nav = J.$('.nav');
  if (!burger || !links || !nav) return;

  /* overlay نیمه‌شفاف پشت منو — با کلیک بسته می‌شود */
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  nav.appendChild(overlay);

  const set = isOpen => {
    links.classList.toggle('open', isOpen);
    if (isOpen) links.classList.remove('closing');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'بستن منو' : 'باز کردن منو');
    overlay.classList.toggle('show', isOpen);
    /* با باز بودن منو، اسکرول صفحه قفل می‌شود */
    document.body.classList.toggle('no-scroll', isOpen);
  };

  /* بستن نرم: انیمیشن محو/افتادن قبل از مخفی‌شدن کامل */
  let closeT = null;
  const closeMenu = () => {
    if (!links.classList.contains('open')) return;
    links.classList.add('closing');
    set(false);
    clearTimeout(closeT);
    closeT = setTimeout(() => links.classList.remove('closing'), 220);
  };

  burger.onclick = () => { if (links.classList.contains('open')) closeMenu(); else set(true); };
  overlay.onclick = closeMenu;
  links.addEventListener('click', e => { if (e.target.closest && e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => {
    if (!(e.target.closest && e.target.closest('.nav-inner'))) closeMenu();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
});

/* رندر آیکون‌های استاتیک پس از آماده‌شدن DOM (و هر رندر داینامیک که refreshIcons می‌خواند) */
J.domReady(() => J.refreshIcons());

/* ---------- هایلایت لینک صفحهٔ فعلی در نوبار (دسکتاپ و منوی موبایل) ---------- */
J.domReady(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  J.$$('.nav-links a').forEach(a => {
    const href = String(a.getAttribute('href') || '').toLowerCase();
    if (href.split('?')[0] === page) a.classList.add('active');
  });
});