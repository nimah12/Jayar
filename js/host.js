/* ==================== پنل میزبان — ثبت‌نام، ثبت اقامتگاه، مدیریت ==================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ---------- وضعیت ورود میزبان ---------- */
let HOST = J.db.host;
let editingId = null; /* آی‌دی اقامتگاه در حال ویرایش */

/* برچسب و کلاس هر وضعیت رزرو */
const BOOKING_STATUS = {
  ok:        { label: 'تأیید شده', cls: 'status-ok' },
  pending:   { label: 'در انتظار', cls: 'status-pending' },
  cancelled: { label: 'رد شده',    cls: 'status-cancel' },
};

const el = {
  register: $('#tabRegister'),
  list: $('#tabList'),
  bookings: $('#tabBookings'),
  stats: $('#tabStats'),
  hostWrap: $('#hostFormWrap'),
};

$$('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    const tab = btn.dataset.tab;
    el.register.classList.toggle('hidden', tab !== 'register');
    el.list.classList.toggle('hidden', tab !== 'list');
    el.bookings.classList.toggle('hidden', tab !== 'bookings');
    el.stats.classList.toggle('hidden', tab !== 'stats');
    if (tab === 'list') renderMyProps();
    if (tab === 'bookings') renderBookings();
    if (tab === 'stats') renderStats();
  };
});

/* ---------- ثبت‌نام میزبان (اگر وارد نشده) ---------- */
function renderHostForm() {
  if (HOST) {
    el.hostWrap.innerHTML = `
      <div class="card animate-rise" style="margin-top:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div>
            <h3>${J.ico('hand')} خوش آمدید، ${J.escape(HOST.name)}</h3>
            <p class="muted" style="font-size:13.5px">شماره تماس: ${J.escape(HOST.phone)} · ${J.fmtNum(J.db.props.filter(p => p.ownerId === HOST.id).length)} اقامتگاه ثبت‌شده</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="logoutBtn">خروج از حساب</button>
        </div>
      </div>`;
    $('#logoutBtn').onclick = () => {
      J.db.host = null;
      J.toast('از حساب میزبان خارج شدید');
      setTimeout(() => location.reload(), 700);
    };
    return;
  }

  el.hostWrap.innerHTML = `
    <div class="card animate-rise" style="margin-top:20px">
      <h3>${J.ico('door-open')} ورود / ثبت‌نام میزبان</h3>
      <p class="muted" style="font-size:13.5px;margin-bottom:16px">برای ثبت اقامتگاه جدید ابتدا نام و شماره تماس خود را ثبت کنید.</p>
      <form class="form" id="hostJoinForm">
        <div class="form-grid">
          <div class="field"><label>نام و نام خانوادگی</label><input id="hName" placeholder="مثلاً رضا کریمی" required></div>
          <div class="field"><label>شماره تماس</label><input id="hPhone" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required></div>
        </div>
        <button class="btn btn-primary" type="submit" style="align-self:flex-start">ورود به پنل میزبان</button>
      </form>
    </div>`;

  $('#hostJoinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#hName').value.trim();
    const phone = $('#hPhone').value.replace(/[\s-]/g, '');
    if (name.length < 3) return J.toast('نام و نام خانوادگی را کامل وارد کنید', 'error');
    if (!/^0\d{10}$/.test(phone)) return J.toast('شماره تماس معتبر نیست', 'error');
    const { host: acc, created } = await J.loginHost(name, phone);
    if (created) J.toast('به‌عنوان میزبان ثبت‌نام شدید');
    else J.toast('خوش آمدید!');
    J.db.host = acc;
    setTimeout(() => location.reload(), 700);
  });
}

/* ---------- شروع ویرایش اقامتگاه ---------- */
function startEdit(id) {
  if (!J.db.props.some(p => String(p.id) === String(id))) return;
  editingId = id;
  renderRegisterForm();
  switchTab('register');
  if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- فرم ثبت/ویرایش اقامتگاه ---------- */
function renderRegisterForm() {
  const isEdit = !!editingId;
  const editing = isEdit ? J.db.props.find(p => String(p.id) === String(editingId)) : null;
  el.register.innerHTML = `
    <div class="card animate-rise">
      <h3>${isEdit ? J.ico('pencil') + ' ویرایش اقامتگاه' : J.ico('home') + ' ثبت اقامتگاه جدید'}</h3>
      <p class="muted" style="font-size:13px;margin-bottom:16px">${isEdit ? 'تغییرات را اعمال کنید و روی «ذخیره تغییرات» بزنید.' : 'قیمت پیشنهادی خود را تعیین کنید؛ جایار پس از بررسی، اقامتگاه را در جستجو نمایش می‌دهد.'}</p>
      <form class="form" id="propForm">
        <div class="form-grid">
          <div class="field"><label>نام اقامتگاه *</label><input id="pTitle" placeholder="مثلاً ویلای ییلاقی دربند" required></div>
          <div class="field"><label>نوع اقامتگاه *</label>
            <select id="pType">
              ${Object.entries(J.TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>شهر *</label>
            <input id="pCity" list="cityList" placeholder="انتخاب کنید یا شهر جدید بنویسید…" required>
            <datalist id="cityList">
              ${J.CITIES.map(c => `<option value="${J.escape(c)}">`).join('')}
            </datalist>
          </div>
          <div class="field"><label>محله</label><input id="pRegion" placeholder="مثلاً نیاوران"></div>
        </div>

        <div class="form-grid">
          <div class="field"><label>قیمت شب (تومان) *</label><input id="pPrice" type="number" min="100000" step="50000" placeholder="۲۰۰۰۰۰۰" required></div>
          <div class="field"><label>ظرفیت مهمان *</label><input id="pGuests" type="number" min="1" max="30" value="4" required></div>
          <div class="field"><label>تعداد اتاق</label><input id="pBedrooms" type="number" min="1" max="30" value="2"></div>
          <div class="field"><label>متراژ</label><input id="pArea" type="number" min="10" placeholder="۱۰۰"></div>
        </div>

        <div class="field">
          <label>امکانات (انتخابی)</label>
          <div class="checkbox-grid" id="pFeats">
            ${Object.entries(J.FEATURES).map(([k, v]) => `<label><input type="checkbox" value="${k}"> ${J.feat(k)}</label>`).join('')}
          </div>
        </div>

        <div class="field">
          <label>توضیحات برای مهمانان</label>
          <textarea id="pDesc" placeholder="چند خط درباره اقامتگاه، موقعیت و امکانات بنویسید…"></textarea>
        </div>

        <div style="display:flex;gap:10px;align-items:center">
          ${isEdit ? '<button class="btn btn-ghost" type="button" id="editCancel">انصراف</button>' : ''}
          <button class="btn btn-primary" type="submit">${isEdit ? 'ذخیره تغییرات' : 'ثبت اقامتگاه در جایار'}</button>
        </div>
      </form>
    </div>`;

  /* پرکردن فرم با مقادیر اقامتگاه در حال ویرایش */
  if (isEdit && editing) {
    $('#pTitle').value = editing.title || '';
    $('#pType').value = editing.type || 'hotel';
    $('#pCity').value = editing.city || '';
    $('#pRegion').value = editing.region || '';
    $('#pPrice').value = editing.price || '';
    $('#pGuests').value = editing.guests || 4;
    $('#pBedrooms').value = editing.bedrooms || 1;
    $('#pArea').value = editing.area || '';
    $$('#pFeats input').forEach(i => { i.checked = (editing.features || []).includes(i.value); });
    $('#pDesc').value = editing.desc || '';
    $('#editCancel').onclick = () => {
      editingId = null;
      renderRegisterForm();
      switchTab('list');
    };
  }

  J.refreshIcons();

  $('#propForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!HOST) {
      J.toast('ابتدا به‌عنوان میزبان وارد شوید', 'error');
      switchTab('register');
      return;
    }
    const title = $('#pTitle').value.trim();
    const type = $('#pType').value;
    const city = $('#pCity').value.trim();
    const price = +$('#pPrice').value || 0;
    const guests = +$('#pGuests').value || 1;
    const feats = $$('#pFeats input:checked').map(i => i.value);

    if (title.length < 3) return J.toast('نام اقامتگاه را کامل وارد کنید', 'error');
    if (!city) return J.toast('شهر را انتخاب یا وارد کنید', 'error');
    if (price < 100000) return J.toast('قیمت شب باید حداقل ۱۰۰ هزار تومان باشد', 'error');
    if (feats.length === 0) return J.toast('حداقل یک امکانات را انتخاب کنید', 'error');

    const old = editingId ? J.db.props.find(p => String(p.id) === String(editingId)) : null;
    const n = {
      id: editingId || J.uidProp(),
      title, type, city,
      region: $('#pRegion').value.trim(),
      price, guests,
      bedrooms: +$('#pBedrooms').value || 1,
      area: +$('#pArea').value || null,
      features: feats,
      desc: $('#pDesc').value.trim() || 'اقامتگاه خصوصی برای اجاره.',
      rating: old ? old.rating : 4.5,
      reviews: old ? old.reviews : 0,
      ownerId: HOST.id,
      createdAt: old ? old.createdAt : new Date().toISOString(),
    };

    if (editingId) {
      J.db.props = J.db.props.map(p => (String(p.id) === String(editingId) ? n : p));
      J.toast('اقامتگاه ویرایش شد');
    } else {
      J.db.props = [...J.db.props, n];
      J.toast('اقامتگاه با موفقیت ثبت شد');
    }
    editingId = null;
    renderRegisterForm();
    renderMyProps();
    switchTab('list');
  });
}

/* ---------- فهرست اقامتگاه‌های من ---------- */
function renderMyProps() {
  if (!HOST) {
    el.list.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('lock')}</div><h3>ابتدا وارد شوید</h3><p class="muted">برای مشاهدهٔ اقامتگاه‌هایتان، ابتدا از تب «ثبت اقامتگاه جدید» وارد شوید.</p></div>`;
    J.refreshIcons();
    return;
  }
  const mine = J.db.props.filter(p => p.ownerId === HOST.id);
  if (!mine.length) {
    el.list.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('home')}</div><h3>هنوز اقامتگاهی ثبت نکرده‌اید</h3><p class="muted">از تب «ثبت اقامتگاه» اولین اقامتگاه خود را اضافه کنید.</p></div>`;
    J.refreshIcons();
    return;
  }
  el.list.innerHTML = `<div class="host-list">${mine.map((p, i) => `
    <div class="host-item animate-fade-up delay-${Math.min(((i % 9) + 1), 9)}">
      <img src="${J.img(p.id, 300, 200)}" alt="" class="transition-opacity duration-300 opacity-90 group-hover:opacity-100">
      <div class="host-item-body">
        <div class="host-item-title">${J.escape(p.title)}</div>
        <div class="muted" style="font-size:13px">${J.ico('map-pin')} ${J.escape(p.city)} · ${J.fmtNum(p.price)} تومان/شب · ${J.ico('star')} ${J.fmtNum(p.rating)}</div>
        <div class="muted" style="font-size:12.5px">${J.escape(p.desc)}</div>
        <div style="margin-top:6px">${[
          p.guests ? `<span class="pill">${J.ico('users')} ${J.fmtNum(p.guests)} مهمان</span>` : '',
          p.bedrooms ? `<span class="pill">${J.ico('bed')} ${J.fmtNum(p.bedrooms)} اتاق</span>` : '',
        ].join('')}</div>
      </div>
      <div class="host-item-actions">
        <a class="btn btn-soft btn-sm" href="detail.html?id=${p.id}" target="_blank" rel="noopener">${J.ico('eye')} نمایش عمومی</a>
        <button class="btn btn-ghost btn-sm" data-edit="${p.id}">${J.ico('pencil')} ویرایش</button>
        <button class="btn btn-danger-soft btn-sm" data-del="${p.id}">حذف</button>
      </div>
    </div>`).join('')}</div>`;

  $$('[data-del]').forEach(b => b.onclick = async () => {
    const propId = b.dataset.del;
    const pendingCount = J.db.bookings
      .filter(x => String(x.propertyId) === String(propId) && x.status === 'pending').length;
    if (pendingCount > 0) {
      J.toast(`این اقامتگاه ${J.fmtNum(pendingCount)} رزرو در انتظار تأیید دارد؛ ابتدا آن‌ها را تأیید یا رد کنید`, 'error');
      return;
    }
    if (await J.confirm('حذف اقامتگاه', 'این اقامتگاه برای همیشه حذف میشود.', 'trash-2', 'حذف')) {
      J.db.props = J.db.props.filter(x => x.id !== propId);
      J.toast('اقامتگاه حذف شد', 'error');
      renderMyProps();
    }
  });
  $$('[data-edit]').forEach(b => b.onclick = () => startEdit(b.dataset.edit));
  J.refreshIcons();
}

/* ---------- رزروهای دریافتی ---------- */
function renderBookings() {
  if (!HOST) {
    el.bookings.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('lock')}</div><h3>ابتدا وارد شوید</h3><p class="muted">برای مشاهدهٔ رزروهای دریافتی، ابتدا از تب «ثبت اقامتگاه جدید» وارد شوید.</p></div>`;
    J.refreshIcons();
    return;
  }
  const mine = J.db.props.filter(p => p.ownerId === HOST.id);
  const ids = new Set(mine.map(p => p.id));
  const list = J.db.bookings.filter(b => ids.has(b.propertyId));

  if (!list.length) {
    el.bookings.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('inbox')}</div><h3>هنوز رزروی دریافت نکرده‌اید</h3><p class="muted">به محض رزرو اقامتگاه‌تان توسط مهمان، اینجا نمایش داده می‌شود.</p></div>`;
    J.refreshIcons();
    return;
  }

  el.bookings.innerHTML = list.map(b => {
    const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
    return `
    <div class="booking-row">
      <div style="flex:1;min-width:220px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b>${J.escape(b.propertyTitle)}</b>
          <span class="status ${st.cls}">${st.label}</span>
        </div>
        <div class="muted" style="font-size:13px;margin-top:4px">
          ${J.ico('user')} ${J.escape(b.name)} · ${J.ico('phone')} ${J.escape(b.phone)}
        </div>
        <div class="muted" style="font-size:12.5px;margin-top:2px">
          ${J.ico('calendar')} ${J.fmtDate(b.checkin)} ← ${J.fmtDate(b.checkout)} · ${J.fmtNum(b.nights)} شب · ${J.fmtNum(b.guests)} مهمان
        </div>
        <div class="muted" style="font-size:12.5px">کد رزرو: ${J.escape(b.id)}</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:18px;font-weight:800;color:var(--brand-dark)">${J.fmtPrice(b.total)}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-soft btn-sm" data-ok="${b.id}">تأیید</button>
          <button class="btn btn-danger-soft btn-sm" data-rej="${b.id}">رد</button>
        </div>
      </div>
    </div>`;
  }).join('');

  $$('[data-ok]').forEach(b => b.onclick = () => {
    J.updateBookingStatus(b.dataset.ok, 'ok');
    J.toast('رزرو تأیید شد');
    renderBookings();
  });
  $$('[data-rej]').forEach(b => b.onclick = () => {
    J.updateBookingStatus(b.dataset.rej, 'cancelled');
    J.toast('رزرو رد شد');
    renderBookings();
  });
  J.refreshIcons();
}

/* ---------- آمار میزبان ---------- */
function renderStats() {
  if (!HOST) {
    el.stats.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('lock')}</div><h3>ابتدا وارد شوید</h3><p class="muted">برای مشاهدهٔ آمار، ابتدا از تب «ثبت اقامتگاه جدید» وارد شوید.</p></div>`;
    J.refreshIcons();
    return;
  }
  const mine = J.db.props.filter(p => p.ownerId === HOST.id);
  if (!mine.length) {
    el.stats.innerHTML = `<div class="empty-state"><div class="emoji">${J.ico('chart-column')}</div><h3>هنوز اقامتگاهی ثبت نکرده‌اید</h3><p class="muted">با ثبت اولین اقامتگاه، آمار اینجا نمایش داده می‌شود.</p></div>`;
    J.refreshIcons();
    return;
  }

  const ids = new Set(mine.map(p => String(p.id)));
  const list = J.db.bookings.filter(b => ids.has(String(b.propertyId)));
  const pending = list.filter(b => b.status === 'pending');
  const confirmed = list.filter(b => b.status === 'ok');
  const revenue = confirmed.reduce((s, b) => s + (b.total || 0), 0);
  const top = [...mine]
    .sort((a, b) => ((b.views || 0) - (a.views || 0)) || (b.rating - a.rating))
    .slice(0, 3);

  el.stats.innerHTML = `
    <div class="card animate-rise">
      <h3>${J.ico('trending-up')} عملکرد اقامتگاه‌های شما</h3>
      <div class="stat-grid" style="margin-top:14px">
        <div class="stat-card"><div class="emoji" style="font-size:26px">${J.ico('clipboard-list')}</div><div class="stat-num">${J.fmtNum(list.length)}</div><div class="stat-lbl">کل رزروها</div></div>
        <div class="stat-card"><div class="emoji" style="font-size:26px">${J.ico('hourglass')}</div><div class="stat-num">${J.fmtNum(pending.length)}</div><div class="stat-lbl">در انتظار تأیید</div></div>
        <div class="stat-card"><div class="emoji" style="font-size:26px">${J.ico('circle-check')}</div><div class="stat-num">${J.fmtNum(confirmed.length)}</div><div class="stat-lbl">رزرو تأییدشده</div></div>
        <div class="stat-card"><div class="emoji" style="font-size:26px">${J.ico('banknote')}</div><div class="stat-num">${J.fmtPrice(revenue)}</div><div class="stat-lbl">درآمد کل (تأییدشده)</div></div>
      </div>
    </div>

    <div class="card animate-rise" style="margin-top:18px">
      <h3>${J.ico('eye')} پربازدیدترین اقامتگاه‌ها</h3>
      ${top.map((p, i) => `
        <div class="rank-row" style="margin-top:${i === 0 ? '14px' : '8px'}">
          <span class="rank-num">${i + 1}</span>
          <span class="rank-title">${J.escape(p.title)}</span>
          <span class="rank-views">${J.ico('eye')} ${J.fmtNum(p.views || 0)} بازدید · ${J.fmtNum(list.filter(b => String(b.propertyId) === String(p.id)).length)} رزرو</span>
        </div>`).join('')}
    </div>`;
  J.refreshIcons();
}

/* ---------- تعویض تب / کمکی ---------- */
function switchTab(name) {
  const btn = $(`.tab-btn[data-tab="${name}"]`);
  if (btn) btn.click();
}

/* مقداردهی نهایی */
J.onReady(() => {
  renderHostForm();
  renderRegisterForm();
  renderMyProps();
});