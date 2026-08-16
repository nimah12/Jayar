/* ==================== صفحه اصلی — جستجو و فهرست اقامتگاه‌ها ==================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const qp = new URLSearchParams(location.search);
const saved = J.db.search;

const state = {
  city: qp.get('city') || (saved && saved.city) || '',
  in: (saved && saved.in) || J.toISO(new Date(Date.now() + 86400000)),
  out: (saved && saved.out) || J.toISO(new Date(Date.now() + 3 * 86400000)),
  guests: saved ? saved.guests : null,
  type: qp.get('type') || 'همه',
  sort: 'recommended',
};

const el = {
  form: $('#searchForm'),
  city: $('#searchCity'),
  in: $('#searchIn'),
  out: $('#searchOut'),
  guests: $('#searchGuests'),
  sort: $('#sortSelect'),
  typeBar: $('#typeBar'),
  grid: $('#grid'),
  count: $('#resultCount'),
  popular: $('#popularTags'),
};

/* ---------- فیلترها ---------- */
function filtered() {
  let list = J.getProperties().filter(p => {
    if (state.city && p.city !== state.city) return false;
    if (state.type !== 'همه' && p.type !== state.type) return false;
    if (state.guests && p.guests < state.guests) return false;
    return true;
  });
  const sorted = [...list];
  if (state.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (state.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}

function render() {
  const list = filtered();
  el.count.innerHTML = `${J.fmtNum(list.length)} اقامتگاه پیدا شد`;
  el.grid.innerHTML = list.length
    ? list.map((p, i) => J.cardHTML(p, i)).join('')
    : `<div class="empty-state animate-rise">
        <div class="emoji">${J.ico('search')}</div>
        <h3>اقامتگاهی پیدا نشد</h3>
        <p class="muted">فیلترها را کم‌تر کنید یا شهر دیگری را امتحان کنید.</p>
      </div>`;
  $$('.type-chip', el.typeBar).forEach(ch =>
    ch.classList.toggle('active', ch.dataset.type === state.type));
  J.refreshIcons();
}

/* ---------- چیپ نوع ---------- */
function renderTypes() {
  const items = [{ key: 'همه', label: 'همه اقامتگاه‌ها', icon: 'map' }].concat(
    Object.entries(J.TYPES).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon })));
  el.typeBar.innerHTML = items.map((t, i) =>
    `<button class="type-chip animate-rise ${state.type === t.key ? 'active' : ''}" data-type="${t.key}" style="animation-delay:${0.15 + i * 0.05}s">${J.ico(t.icon)} ${t.label}</button>`).join('');
  el.typeBar.onclick = e => {
    const chip = e.target.closest('.type-chip');
    if (!chip) return;
    state.type = chip.dataset.type;
    render();
  };
}

/* ---------- جستجوی مقصد ---------- */
function renderCitySelect() {
  el.city.innerHTML = `<option value="">همه ایران</option>` +
    J.CITIES.map(c => `<option value="${J.escape(c)}">${J.escape(c)}</option>`).join('');
  el.city.value = state.city;
}

function renderPopular() {
  const top = [...J.CITIES]
    .map(c => ({ city: c, score: J.BASE_PROPERTIES.filter(p => p.city === c).reduce((s, p) => s + p.rating, 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  el.popular.innerHTML = top.map(t =>
    `<button class="popular-tag" data-city="${J.escape(t.city)}">${J.escape(t.city)}</button>`).join('');
  el.popular.onclick = e => {
    const tag = e.target.closest('.popular-tag');
    if (!tag) return;
    state.city = tag.dataset.city;
    el.city.value = state.city;
    render();
  };
}

/* ---------- فرم جستجو ---------- */
function bindSearch() {
  /* محدودیت تاریخ: خروج حداقل یک روز بعد از ورود (همان منطق صفحهٔ رزرو) */
  const clamp = () => J.clampDates(el.in, el.out);
  el.in.onchange = clamp;
  el.out.onchange = clamp;

  el.form.onsubmit = e => {
    e.preventDefault();
    state.city = el.city.value;
    state.in = el.in.value || state.in;
    state.out = el.out.value || state.out;
    state.guests = el.guests.value ? +el.guests.value : null;
    if (J.nightsBetween(state.in, state.out) <= 0) {
      J.toast('تاریخ خروج باید بعد از ورود باشد', 'error');
      return;
    }
    J.db.search = { city: state.city, in: state.in, out: state.out, guests: state.guests };
    render();
  };
  el.sort.onchange = () => { state.sort = el.sort.value; render(); };
  el.city.onchange = () => { state.city = el.city.value; render(); };
}

/* ---------- علاقه‌مندی ---------- */
function toggleFav(id) {
  const has = J.db.favs.includes(id);
  J.db.favs = has ? J.db.favs.filter(x => x !== id) : [...J.db.favs, id];
  return !has;
}
function bindFavs() {
  el.grid.onclick = e => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    const now = toggleFav(btn.dataset.fav);
    btn.classList.toggle('active', now);
    btn.classList.remove('animate-heart-pop');
    void btn.offsetWidth;
    btn.classList.add('animate-heart-pop');
  };
}

/* ---------- مقداردهی ---------- */
J.onReady(() => {
  el.in.value = state.in;
  el.out.value = state.out;
  el.guests.value = state.guests || 2;
  el.in.min = J.todayISO(); /* ورود از امروز به بعد */
  J.clampDates(el.in, el.out); /* مینِ اولیهٔ خروج */
  renderTypes();
  renderCitySelect();
  renderPopular();
  bindSearch();
  bindFavs();
  render();
});