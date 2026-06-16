import { useRef, useEffect, useState } from 'react';
import '../styles/categories.css';

// Decorative, cross-platform flag badges (emoji flags don't render on Windows).
const FLAGS = {
  eu: (
    <svg viewBox="0 0 48 48" className="cat-flag" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#039" />
      <g fill="#fc0">
        <circle cx="39" cy="24" r="1.7" />
        <circle cx="37" cy="31.5" r="1.7" />
        <circle cx="31.5" cy="37" r="1.7" />
        <circle cx="24" cy="39" r="1.7" />
        <circle cx="16.5" cy="37" r="1.7" />
        <circle cx="11" cy="31.5" r="1.7" />
        <circle cx="9" cy="24" r="1.7" />
        <circle cx="11" cy="16.5" r="1.7" />
        <circle cx="16.5" cy="11" r="1.7" />
        <circle cx="24" cy="9" r="1.7" />
        <circle cx="31.5" cy="11" r="1.7" />
        <circle cx="37" cy="16.5" r="1.7" />
      </g>
    </svg>
  ),
  cn: (
    <svg viewBox="0 0 48 48" className="cat-flag" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#de2910" />
      <g fill="#ffde00">
        <circle cx="17" cy="18" r="4.5" />
        <circle cx="27" cy="13" r="1.7" />
        <circle cx="31" cy="17" r="1.7" />
        <circle cx="31" cy="23" r="1.7" />
        <circle cx="27" cy="27" r="1.7" />
      </g>
    </svg>
  ),
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="cat-btn-icon" aria-hidden="true">
    <path d="M10 2a8 8 0 1 0 4.9 14.32l5.39 5.38 1.41-1.41-5.38-5.39A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
  </svg>
);

const CARDS = [
  { title: 'خودرو', sub: 'از اروپا', region: 'eu' },
  { title: 'خودرو', sub: 'از چین', region: 'cn' },
];

export default function Categories() {
  const gridRef = useRef(null);
  const [shown, setShown] = useState(false);

  // Reveal the cards as they scroll into view (one-shot).
  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="categories" id="services">
      <div className="section-inner">
        <div className={`cat-grid${shown ? ' is-visible' : ''}`} ref={gridRef}>
          {CARDS.map((c) => (
            <div className={`cat-card cat-card--${c.region}`} key={c.sub}>
              <div className="cat-badge">{FLAGS[c.region]}</div>
              <div className="cat-body">
                <div className="cat-title">{c.title}</div>
                <div className="cat-sub">{c.sub}</div>
              </div>
              <div className="cat-actions">
                <a href="#" className="cat-btn cat-btn--gold">مشاهده خودرو ها</a>
                <div className="cat-actions-row">
                  <a href="#" className="cat-btn cat-btn--outline">مشاهده خدمات</a>
                  <a href="#" className="cat-btn cat-btn--dark"><SearchIcon />جستجوی خودرو</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
