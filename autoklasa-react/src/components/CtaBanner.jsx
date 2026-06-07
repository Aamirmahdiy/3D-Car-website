import '../styles/ctaBanner.css';

export default function CtaBanner() {
  return (
    <div className="cta-banner">
      <div className="cta-inner">
        <div className="section-label">Ready for a new car?</div>
        <h2 className="section-title">Order a free<br />car search</h2>
        <p>Describe your requirements and we'll find the perfect car for you. No commitment, no upfront costs.</p>
        <div className="cta-actions">
          <a href="#" className="btn-primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Order a car search
          </a>
          <a href="tel:+48579779220" className="btn-secondary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            +48 579 779 220
          </a>
        </div>
      </div>
    </div>
  );
}
