import '../styles/ctaBanner.css';

export default function CtaBanner() {
  return (
    <div className="cta-banner" id="order">
      <div className="cta-inner">
        <div className="section-label">آماده یک خودروی جدید هستید؟</div>
        <h2 className="section-title">سفارش رایگان<br />جستجوی خودرو</h2>
        <p>نیازهای خود را شرح دهید تا خودروی ایده‌آل را برای شما پیدا کنیم. بدون تعهد، بدون هزینه اولیه.</p>
        <div className="cta-actions">
          <a href="#" className="btn-primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            سفارش جستجوی خودرو
          </a>
          <a href="tel:+989102181322" className="btn-secondary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <span dir="ltr">+98 910 218 1322</span>
          </a>
        </div>
      </div>
    </div>
  );
}
