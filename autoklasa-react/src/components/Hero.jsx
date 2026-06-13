import '../styles/hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>خرید خودرو <em>آنلاین.</em></h1>

        <p>با ما در وقت و انرژی خود صرفه‌جویی می‌کنید. خودتان دنبال خودرو نگردید، آن را به دست متخصصان بسپارید.</p>

        <div className="hero-checks">
          <span>جستجو می‌کنیم</span>
          <span>بررسی می‌کنیم</span>
          <span>تحویل می‌دهیم</span>
        </div>

        <div className="hero-actions">
          <a href="#" className="btn-hero-outline">مشاهده خدمات</a>
          <a href="#" className="btn-hero-gold">درخواست قیمت</a>
        </div>
      </div>
    </section>
  );
}
