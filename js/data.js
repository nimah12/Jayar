/* ==================== جایار — داده‌های نمونه ==================== */

/* تصویر محلی واقعی — از پوشهٔ images (بدون نیاز به اینترنت هنگام نمایش) */
const IMG_POOL = 15;
J.img = (seed, _w, _h) => {
  const s = String(seed);
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  const n = ((sum % IMG_POOL) + IMG_POOL) % IMG_POOL + 1;
  return `images/p${n}.jpg`;
};

J.BASE_PROPERTIES = [
  {
    id: 'v1', title: 'ویلا ساحلی آبی‌رنگ کیش', type: 'villa', city: 'کیش', region: 'ساحل مرجان',
    price: 3200000, guests: 8, area: 320, bedrooms: 4, rating: 4.9, reviews: 46,
    features: ['wifi', 'sea', 'pool', 'kitchen', 'parking', 'jacuzzi', 'balcony', 'washing', 'aircon'],
    desc: 'ویلای استخردار رو به دریا با دسترسی مستقیم به ساحل مرجان؛ مناسب تعطیلات خانوادگی و مهمان‌پذیری.',
  },
  {
    id: 'h1', title: 'هتل پنج‌ستاره پارس رازی', type: 'hotel', city: 'تهران', region: 'سعادت‌آباد',
    price: 2850000, rating: 4.6, reviews: 210, guests: 2, area: 40, bedrooms: 1,
    features: ['wifi', 'pool', 'gym', 'breakfast', 'tv', 'aircon', 'parking', 'coffee'],
    desc: 'هتلی لوکس در قلب تهران با نظردهی عالی مهمانان، صبحانه بوفه و استخر روباز.',
  },
  {
    id: 'v2', title: 'ویلا باغ انگور کاشان', type: 'villa', city: 'کاشان', region: 'نیاسر',
    price: 1900000, rating: 4.5, reviews: 32, guests: 6, area: 260, bedrooms: 3,
    features: ['wifi', 'parking', 'park', 'kitchen', 'bbq', 'washing', 'tv'],
    desc: 'ویلای حیاط‌دار بین دو باغ، نزدیک به باغ‌های تاریخی کاشان؛ ایده‌آل برای دورهمی.',
  },
  {
    id: 's1', title: 'سوییت آفتاب مشهد', type: 'suite', city: 'مشهد', region: 'بلوار وکیل‌آباد',
    price: 1600000, rating: 4.4, reviews: 97, guests: 4, area: 90, bedrooms: 2,
    features: ['wifi', 'tv', 'aircon', 'kitchen', 'washing', 'coffee'],
    desc: 'سوییت مبله نزدیک حرم امام رضا(ع)؛ تمیز، نورگیر با پیاده‌روی کوتاه و خدمات ۲۴ ساعته.',
  },
  {
    id: 'a1', title: 'اقامتگاه سنتی یزد', type: 'apartment', city: 'یزد', region: 'بافت تاریخی',
    price: 950000, rating: 4.7, reviews: 54, guests: 3, area: 70, bedrooms: 1,
    features: ['wifi', 'breakfast', 'tv', 'parking', 'washing'],
    desc: 'خانه‌ای باسابقه در بافت تاریخی یزد با حیاط مرکزی و بام مهتابی برای تماشای شهر.',
  },
  {
    id: 'h2', title: 'هتل ارگ تبریز', type: 'hotel', city: 'تبریز', region: 'مرکز شهر',
    price: 1750000, rating: 4.3, reviews: 128, guests: 2, area: 24, bedrooms: 1,
    features: ['wifi', 'tv', 'aircon', 'breakfast', 'parking'],
    desc: 'هتل چهارستاره نزدیک بازار تاریخی تبریز و ارگ علی‌شاه.',
  },
  {
    id: 'v3', title: 'ویلا کوهستانی چالوس', type: 'villa', city: 'چالوس', region: 'نمک‌آبرود',
    price: 2400000, rating: 4.8, reviews: 61, guests: 5, area: 300, bedrooms: 3,
    features: ['wifi', 'mountain', 'jacuzzi', 'washing', 'park', 'tv'],
    desc: 'ویلای چوبی با نمای کوه‌های البرز، جکوزی بالکن و هوای دلپذیر؛ مناسب تعطیلات خانوادگی.',
  },
  {
    id: 'a2', title: 'آپارتمان مبله اصفهان', type: 'apartment', city: 'اصفهان', region: 'چهارباغ',
    price: 1400000, rating: 4.2, reviews: 40, guests: 3, area: 84, bedrooms: 2,
    features: ['wifi', 'kitchen', 'tv', 'aircon', 'washing'],
    desc: 'آپارتمان تمیز و نورگیر نزدیک پل خواجو و میدان نقش جهان.',
  },
  {
    id: 'h3', title: 'هتل گل‌رخ گیلان', type: 'hotel', city: 'رشت', region: 'مرجان',
    price: 2100000, rating: 4.5, reviews: 77, guests: 2, area: 30, bedrooms: 1,
    features: ['wifi', 'pool', 'tv', 'aircon', 'restaurant', 'parking'],
    desc: 'هتلی در نزدیکی تالاب انزلی با رستوران گیلکی و باغچه ساحلی.',
  },
  {
    id: 's2', title: 'سوییت دروازه قرآن شیراز', type: 'suite', city: 'شیراز', region: 'دروازه قرآن',
    price: 1250000, rating: 4.5, reviews: 88, guests: 4, area: 72, bedrooms: 2,
    features: ['wifi', 'tv', 'aircon', 'kitchen', 'coffee'],
    desc: 'سوییت نورانی با منظره دروازه قرآن، نزدیک حافظیه و بازار وکیل.',
  },
];

J.CITIES = [...new Set(J.BASE_PROPERTIES.map(p => p.city))];