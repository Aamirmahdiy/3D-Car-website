import { useState } from 'react';
import '../styles/header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header>
        <div className="nav-inner">
          <nav>
            <a href="#">درباره شرکت</a>
            <a href="#">خدمات</a>
            <a href="#">وبلاگ</a>
            <a href="#">نظرات</a>
            <a href="#">تماس</a>
            <a href="#" className="btn-nav">سفارش جستجوی خودرو</a>
          </nav>

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        <a href="#" onClick={() => setMenuOpen(false)}>درباره شرکت</a>
        <a href="#" onClick={() => setMenuOpen(false)}>خدمات</a>
        <a href="#" onClick={() => setMenuOpen(false)}>وبلاگ</a>
        <a href="#" onClick={() => setMenuOpen(false)}>نظرات</a>
        <a href="#" onClick={() => setMenuOpen(false)}>تماس</a>
        <a href="#" onClick={() => setMenuOpen(false)} style={{ color: 'var(--white)' }}>سفارش جستجوی خودرو</a>
      </div>
    </>
  );
}
