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

J.TYPES = {
  hotel: { label: 'هتل', icon: '🏨' },
  villa: { label: 'ویلا', icon: '🏡' },
  suite: { label: 'سوییت', icon: '✨' },
  apartment: { label: 'اقامتگاه', icon: '🏢' },
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
  wifi: '📶', parking: '🅿️', tv: '📺', breakfast: '🥐', kitchen: '🍳', aircon: '❄️',
  washing: '🧺', coffee: '☕', jacuzzi: '🛁', pool: '🏊', gym: '🏋️', park: '🌳',
  bbq: '🍢', restaurant: '🍽️', sea: '🌊', mountain: '⛰️', balcony: '🪑',
};
J.feat = k => `${J.FICON[k] || '✦'} ${J.FEATURES[k] || k}`;

J.toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
J.todayISO = () => J.toISO(new Date());

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

J.confirm = (title, desc, emoji = '❓', okText = 'تایید') =>
  new Promise(resolve => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal">
        <div class="emoji">${emoji}</div>
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
  });

J.initTheme = () => {
  const stored = localStorage.getItem('jayar_theme');
  const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  const btn = J.$('.theme-toggle');
  const sync = () => { if (btn) btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; };
  sync();
  if (btn) btn.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('jayar_theme', isDark ? 'light' : 'dark');
    sync();
  };
};

J.onReady = fn => { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); };

J.onReady(J.initTheme);