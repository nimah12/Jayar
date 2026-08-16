/* ==================== صفحه جزئیات اقامتگاه و رزرو آنلاین ==================== */
const $ = (s, c = document) => c.querySelector(s);

const q = new URLSearchParams(location.search);

const REVIEW_POOL = [
  ['سارا محمدی', 'محیط بسیار تمیز و آرام بود، اقامت فوق‌العاده‌ای داشتیم.'],
  ['امیر حسینی', 'از رزرو آنلاین و قیمت منصفانه کاملاً راضی بودم.'],
  ['لیلا کریمی', 'موقعیت عالی، دسترسی راحت و امکانات کامل.'],
  ['وحید رستمی', 'دقیقاً مطابق عکس‌ها و توضیحات بود. قطعاً دوباره رزرو می‌کنم.'],
  ['نگار موسوی', 'میزبان بسیار خوش‌برخورد و پاسخ‌گو بود.'],
];

function stars(n) {
  const full = Math.max(1, Math.round(n));
  const on = '<i class="ico star-fill" data-lucide="star"></i>'.repeat(full);
  const off = '<i class="ico" data-lucide="star"></i>'.repeat(5 - full);
  return on + off;
}

function sampleReviews(prop) {
  const reviewSeed = [...String(prop.id)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return [0, 1, 2].map(i => REVIEW_POOL[(reviewSeed + i * 2) % REVIEW_POOL.length]);
}

function pointBars(prop) {
  const base = Math.max(50, Math.round((prop.rating / 5) * 92));
  const cats = [
    ['پاکیزگی', Math.min(100, base + 2)],
    ['موقعیت', Math.min(100, base - 3)],
    ['امکانات', Math.min(100, base - 6)],
    ['ارزش خرید', Math.min(100, base)],
  ];
  return cats.map(([label, v]) => `
    <div class="point">
      <div class="muted" style="font-size:12.5px;display:flex;justify-content:space-between">${label}<b style="color:var(--text)">${(v / 20).toFixed(1)}</b></div>
      <div class="bar"><div class="fill" style="width:${v}%"></div></div>
    </div>`).join('');
}

function render(prop) {
  const t = J.TYPES[prop.type];
  const saved = J.db.search;
  const in0 = (saved && saved.in) || J.toISO(new Date(Date.now() + 86400000));
  const out0 = (saved && saved.out) || J.toISO(new Date(Date.now() + 3 * 86400000));

  /* فیلدهای اختیاری: فقط مقادیر موجود نمایش داده می‌شوند (بدون «،» و «۰» اضافی) */
  const locParts = [prop.city, prop.region].filter(Boolean);
  const pills = [
    prop.guests ? `<span class="pill">${J.ico('users')} ${J.fmtNum(prop.guests)} مهمان</span>` : '',
    prop.bedrooms ? `<span class="pill">${J.ico('bed')} ${J.fmtNum(prop.bedrooms)} اتاق</span>` : '',
    prop.area ? `<span class="pill">${J.ico('ruler')} ${J.fmtNum(prop.area)} متر</span>` : '',
    `<span class="pill">${J.ico('key')} ${t.label}</span>`,
  ].filter(Boolean).join('\n              ');

  const featGrid = (prop.features || []).length
    ? (prop.features || []).map(f => `<span class="feat yes">${J.feat(f)}</span>`).join('')
    : '<span class="muted">امکاناتی ثبت نشده</span>';

  $('#wrap').innerHTML = `
    <div class="gallery animate-rise">
      <div class="gallery-main">
        <img src="${J.img(prop.id, 1280, 640)}" alt="${J.escape(prop.title)}">
      </div>
      <div class="gallery-side">
        <img src="${J.img(prop.id + '-b', 640, 460)}" alt="">
        <img src="${J.img(prop.id + '-c', 640, 460)}" alt="">
      </div>
    </div>

    <div class="detail-wrap">
      <div>
        <div class="detail-head animate-rise" style="animation-delay:.08s">
          <div>
            <h1 class="detail-title">${J.ico(t.icon)} ${J.escape(prop.title)}</h1>
            <div class="detail-loc">${locParts.length ? J.ico('map-pin') + ' ' + locParts.map(x => J.escape(x)).join('، ') : ''}</div>
            <div class="pill-row">
              ${pills}
            </div>
          </div>
          <div class="avg-box">
            <b>${J.fmtNum(prop.rating)}</b>
            <span>از ۵ · ${J.fmtNum(prop.reviews)} نظر</span>
          </div>
        </div>

        <div class="card animate-rise transition-transform duration-200 hover:-translate-y-0.5" style="margin-top:18px;animation-delay:.12s">
          <h3>${J.ico('info')} درباره این اقامتگاه</h3>
          <p class="muted">${J.escape(prop.desc)}</p>
        </div>

        <div class="card animate-rise" style="animation-delay:.16s">
          <h3>${J.ico('sparkles')} امکانات</h3>
          <div class="feat-grid">${featGrid}</div>
        </div>

        <div class="card animate-rise" style="animation-delay:.2s">
          <h3>${J.ico('chart-column')} امتیازات از نگاه مهمان‌ها</h3>
          <div class="points" style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px">${pointBars(prop)}</div>
        </div>

        <div class="card animate-rise" style="animation-delay:.24s">
          <h3>${J.ico('message-circle')} نظرات مهمان‌ها</h3>
          ${sampleReviews(prop).map(r => `
            <div style="border-top:1px solid var(--border);padding:14px 4px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <b>${J.escape(r[0])}</b>
                <span class="star" style="font-size:13px">${stars(prop.rating)}</span>
              </div>
              <p class="muted" style="font-size:13.5px;margin-top:6px">${J.escape(r[1])}</p>
            </div>`).join('')}
        </div>

        <div class="card animate-rise" style="animation-delay:.28s">
          <h3>${J.ico('scroll')} قوانین خانه</h3>
          <ul class="muted" style="padding-inline-start:22px;font-size:13.5px;line-height:2.2">
            <li>ورود از ساعت ۱۴:۰۰ و خروج تا ۱۲:۰۰</li>
            <li>ارائهٔ مدارک هویتی برای هر مهمان الزامی است</li>
            <li>برگزاری مراسم و مهمانی در محل ممنوع است</li>
            <li>استرداد رایگان تا ۲۴ ساعت قبل از ورود</li>
          </ul>
        </div>
      </div>

      <div>
        <div class="card book-box animate-rise" style="animation-delay:.1s">
          <div class="book-price"><b id="priceLbl">${J.fmtNum(prop.price)}</b><span>تومان / شب</span></div>
          <div class="book-rate">
            <span class="rate-box">${J.ico('star')} ${J.fmtNum(prop.rating)}</span>
            <span>${J.fmtNum(prop.reviews)} نظر</span>
          </div>

          <form class="form" id="bookForm" novalidate>
            <div class="form-grid">
              <div class="field">
                <label>تاریخ ورود</label>
                <input type="date" id="bIn" value="${in0}" min="${J.todayISO()}" required>
              </div>
              <div class="field">
                <label>تاریخ خروج</label>
                <input type="date" id="bOut" value="${out0}" min="${J.todayISO()}" required>
              </div>
            </div>
            <div class="field">
              <label>جمع مهمان‌ها</label>
              <input type="number" id="bGuests" min="1" max="${prop.guests}" value="2" required>
            </div>
            <div class="field">
              <label>نام و نام خانوادگی</label>
              <input id="bName" placeholder="مثلاً علی رضایی" required>
            </div>
            <div class="field">
              <label>شماره تماس</label>
              <input id="bPhone" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required>
            </div>

            <div id="bSummary"></div>

            <button class="btn btn-primary btn-block" type="submit">تکمیل رزرو</button>
          </form>
        </div>
      </div>
    </div>`;
}

function initBooking(prop) {
  const f      = $('#bookForm');
  const chIn   = $('#bIn');
  const chOut  = $('#bOut');
  const guests = $('#bGuests');
  const name   = $('#bName');
  const phone  = $('#bPhone');
  const sum    = $('#bSummary');

  function recalc() {
    const nights = J.nightsBetween(chIn.value, chOut.value);
    if (nights <= 0) {
      sum.innerHTML = `<div class="summary-total" style="color:var(--danger);border:0">تاریخ خروج باید بعد از ورود باشد</div>`;
      return;
    }
    const sub = prop.price * nights;
    const fee = Math.round(sub * 0.1);
    const total = sub + fee;
    const totalLbl = document.createElement('b');
    totalLbl.className = 'animate-count-pop';
    totalLbl.textContent = J.fmtPrice(total);
    const row = document.createElement('div');
    row.className = 'summary-total';
    const span = document.createElement('span');
    span.textContent = 'قابل پرداخت';
    row.appendChild(span);
    row.appendChild(totalLbl);
    sum.innerHTML = `
      <div class="summary-row"><span>${J.fmtNum(prop.price)} × ${J.fmtNum(nights)} شب</span><span>${J.fmtPrice(sub)}</span></div>
      <div class="summary-row"><span>هزینه سرویس جایار</span><span>${J.fmtPrice(fee)}</span></div>`;
    sum.appendChild(row);
    return total;
  }

  /* خروج باید حداقل یک روز بعد از ورود باشد؛ ورود هم از امروز به بعد (منطق مشترک در common.js) */
  function clampDates() {
    J.clampDates(chIn, chOut);
    recalc();
  }

  chIn.onchange = clampDates;
  chOut.onchange = clampDates;
  guests.oninput = recalc;

  f.onsubmit = e => {
    e.preventDefault();
    const nights = J.nightsBetween(chIn.value, chOut.value);
    if (nights <= 0) return J.toast('تاریخ خروج باید بعد از ورود باشد', 'error');
    const g = Math.max(1, +guests.value || 1);
    if (g > prop.guests) return J.toast(`ظرفیت حداکثر ${J.fmtNum(prop.guests)} مهمان است`, 'error');
    if (name.value.trim().length < 3) return J.toast('نام و نام خانوادگی را کامل وارد کنید', 'error');
    if (!/^0\d{10}$/.test(phone.value.replace(/[\s-]/g, ''))) return J.toast('شماره تماس معتبر وارد کنید', 'error');

    const subtotal = prop.price * nights;
    const fee = Math.round(subtotal * 0.1);
    const total = subtotal + fee;
    const id = J.uid();

    J.addBooking({
      id,
      propertyId: prop.id,
      propertyTitle: prop.title,
      type: prop.type,
      city: prop.city,
      ownerId: prop.ownerId || null,
      checkin: chIn.value,
      checkout: chOut.value,
      nights,
      guests: g,
      name: name.value.trim(),
      phone: phone.value.replace(/[\s-]/g, ''),
      subtotal, fee, total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    successModal(id, total);
  };

  clampDates();
}

function successModal(id, total) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `
    <div class="modal">
      <div class="emoji">${J.ico('party-popper')}</div>
      <h3>رزرو با موفقیت ثبت شد</h3>
      <p>کد رزرو: <b>${J.escape(id.toUpperCase().slice(0, 10))}</b></p>
      <p>مبلغ قابل پرداخت: <b>${J.fmtPrice(total)}</b></p>
      <p class="muted" style="font-size:13px">درخواست شما برای میزبان ارسال شد؛ پس از تأیید، پیامک اطلاع‌رسانی می‌شود.</p>
      <div class="modal-actions">
        <a class="btn btn-primary" href="index.html">ثبت رزرو جدید</a>
        <button class="btn btn-soft" id="closeModal">بستن</button>
      </div>
    </div>`;
  const close = () => back.remove();
  $('#closeModal', back).onclick = close;
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.body.appendChild(back);
  J.refreshIcons();
}

/* ---------- شروع صفحه ---------- */
function boot() {
  const prop = J.getProperty(q.get('id') || 'v1');

  if (!prop) {
    $('#wrap').innerHTML = `
      <div class="empty-state" style="margin-top:30px">
        <div class="emoji">${J.ico('frown')}</div>
        <h3>اقامتگاهی یافت نشد</h3>
        <p class="muted">امکان دارد این اقامتگاه حذف شده باشد.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:16px">بازگشت به جستجو</a>
      </div>`;
    J.refreshIcons();
    return;
  }

  document.title = `${prop.title} | جایار`;
  /* breadcrumb با Microdata (schema.org BreadcrumbList) — برای نمایش خرده‌پرت در گوگل */
  const bcList = $('#bcList');
  if (bcList) {
    const cityLi = prop.city
      ? `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
           <a itemprop="item" href="index.html?city=${encodeURIComponent(prop.city)}"><span itemprop="name">${J.escape(prop.city)}</span></a>
           <meta itemprop="position" content="2">
         </li>`
      : '';
    bcList.innerHTML += cityLi + `
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="crumb-current">
        <span itemprop="name">${J.escape(prop.title)}</span>
        <meta itemprop="position" content="3">
      </li>`;
  }
  J.recordView(prop.id); /* شمارش بازدید برای آمار پربازدیدترین‌ها */
  render(prop);
  initBooking(prop);
  J.refreshIcons();
}

J.onReady(boot);