/* ==================== صفحه علاقه‌مندی‌ها ==================== */
const $ = (s, c = document) => c.querySelector(s);

const el = {
  grid: $('#grid'),
  count: $('#resultCount'),
};

function render() {
  /* حذف خودکار آی‌دی‌های اقامتگاه‌های حذف‌شده */
  const valid = J.db.favs.filter(id => J.getProperty(id));
  if (valid.length !== J.db.favs.length) J.db.favs = valid;

  const props = valid.map(id => J.getProperty(id));
  el.count.innerHTML = props.length
    ? `${J.fmtNum(props.length)} اقامتگاه ذخیره شده`
    : '';
  el.grid.innerHTML = props.length
    ? props.map((p, i) => J.cardHTML(p, i)).join('')
    : `<div class="empty-state animate-rise">
        <div class="emoji">${J.ico('heart-crack')}</div>
        <h3>هنوز اقامتگاهی به علاقه‌مندی‌ها اضافه نکرده‌اید</h3>
        <p class="muted">روی دکمهٔ ${J.ico('heart')} روی هر کارت در صفحهٔ جستجو بزنید تا اینجا ذخیره شود.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:16px">جستجوی اقامتگاه</a>
      </div>`;
  J.refreshIcons();
}

/* ---------- حذف از علاقه‌مندی‌ها ---------- */
function bindFavs() {
  el.grid.onclick = e => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    if (J.db.favs.includes(btn.dataset.fav)) {
      J.db.favs = J.db.favs.filter(x => x !== btn.dataset.fav);
      J.toast('از علاقه‌مندی‌ها حذف شد');
      render();
    }
  };
}

/* ---------- مقداردهی ---------- */
J.onReady(() => {
  render();
  bindFavs();
});
