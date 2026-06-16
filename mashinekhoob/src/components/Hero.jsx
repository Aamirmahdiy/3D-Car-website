import '../styles/hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>خرید خودرو <em>آنلاین</em></h1>

        <p>ما مسیر انتخاب خودرو را برای شما ساده می‌کنیم؛ جستجوی خودرو را به متخصصان بسپارید.
</p>

        <div className="hero-checks">
          <span>جستجو می‌کنیم</span>
          <span>بررسی می‌کنیم</span>
          <span>تحویل می‌دهیم</span>
        </div>

        <div className="hero-actions">
          <span className="hero-rise hero-rise-1"><a href="#" className="btn-hero-outline">مشاهده خدمات</a></span>
          <span className="hero-rise hero-rise-2"><a href="#" className="btn-hero-gold">مشاهده خودرو ها</a></span>
        </div>
      </div>
    </section>
  );
}
