import '../styles/reviews.css';

const GoogleG = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const REVIEWS = [
  { initial: 'س', avatarClass: 'avatar-1', name: 'سامان ر.',  date: '۲ ماه پیش',  text: 'خدمات حرفه‌ای در بالاترین سطح. کمک در انتخاب خودرو، بررسی تاریخچه، تحویل درب منزل. به هر کسی که دنبال یک واردکننده مطمئن است توصیه می‌کنم.' },
  { initial: 'م', avatarClass: 'avatar-2', name: 'مهدی ک.',  date: '۳ ماه پیش', text: 'دقیقاً همان خودرویی را که خواسته بودم پیدا کردند. کل فرایند سریع و بدون دردسر بود. خودرو سر وقت و بدون هیچ غافلگیری‌ای رسید. کاملاً توصیه می‌کنم!' },
  { initial: 'ج', avatarClass: 'avatar-3', name: 'جواد الف.', date: '۴ ماه پیش', text: 'شرکت عالی، از صمیم قلب توصیه می‌کنم. همیشه ارتباط سریع و مشاوره تخصصی. مشخص است که واقعاً به مشتری اهمیت می‌دهند، نه فقط به سود.' },
  { initial: 'آ', avatarClass: 'avatar-4', name: 'آناهیتا س.', date: '۵ ماه پیش', text: 'خدمات فوق‌العاده! هیچ‌وقت فکر نمی‌کردم خرید خودرو از خارج این‌قدر ساده باشد. ماشین خوب همه‌چیز را از صفر تا صد انجام داد. مرسدس جدیدم کاملاً بی‌نقص است!' },
];

export default function Reviews() {
  return (
    <section className="reviews">
      <div className="section-inner">
        <div className="reviews-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <span className="reviews-gold">نظرات</span> مشتریان
          </h2>
        </div>

        <div className="reviews-marquee">
          <div className="reviews-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div className="review-card" key={i} aria-hidden={i >= REVIEWS.length}>
                <div className="review-top">
                  <div className="reviewer">
                    <div className={`reviewer-avatar ${r.avatarClass}`}>{r.initial}</div>
                    <div>
                      <div className="reviewer-name">{r.name}</div>
                      <div className="reviewer-date">{r.date}</div>
                    </div>
                  </div>
                  <div className="review-stars">★★★★★</div>
                </div>
                <p className="review-text">{r.text}</p>
                <div className="review-source">
                  <GoogleG size={14} />
                  نظر از گوگل
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reviews-more">
          <a href="#">
            مشاهده همه نظرات (+۱۷۸)
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
