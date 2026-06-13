import '../styles/footer.css';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/>
                  <circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <span className="logo-text">ماشین<span>خوب</span></span>
            </a>
            <p>واردکننده حرفه‌ای خودرو از اروپا و چین. ما خودروی رویایی شما را پیدا می‌کنیم، بررسی می‌کنیم و تحویل می‌دهیم — ایمن و بدون دردسر.</p>
          </div>

          <div className="footer-col">
            <h4>شرکت</h4>
            <ul>
              {['درباره ما', 'وبلاگ', 'نظرات', 'فرصت‌های شغلی', 'تماس'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>خدمات</h4>
            <ul>
              {['خودرو از اروپا', 'خودرو از چین', 'سفارش جستجو', 'تأمین مالی', 'دریافت قیمت'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>اطلاعات</h4>
            <ul>
              {['حریم خصوصی', 'شرایط استفاده از خدمات', 'حفاظت از داده‌ها', 'نقشه سایت'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; ۲۰۲۶ ماشین خوب — تمامی حقوق محفوظ است</span>
          <div className="footer-socials">
            <a href="#" className="social-btn" title="Facebook">
              <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" className="social-btn" title="Instagram">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="#9ca3af" strokeWidth="2"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="#9ca3af" strokeWidth="2"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#9ca3af" strokeWidth="2"/>
              </svg>
            </a>
            <a href="#" className="social-btn" title="YouTube">
              <svg viewBox="0 0 24 24">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0d0d0d"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
