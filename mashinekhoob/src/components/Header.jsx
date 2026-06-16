import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  // On the home page use in-page anchors; elsewhere (e.g. /blog) link back to the
  // home page with the anchor so the section links still work.
  const sec = (id) => (onHome ? `#${id}` : `/#${id}`);
  const close = () => setMenuOpen(false);

  return (
    <>
      <header>
        <div className="nav-inner">
          <nav>
            <a href="#">درباره شرکت</a>
            <a href={sec('services')}>خدمات</a>
            <Link to="/blog">وبلاگ</Link>
            <a href={sec('reviews')}>نظرات</a>
            <a href={sec('contact')}>تماس</a>
            <a href={sec('order')} className="btn-nav">سفارش جستجوی خودرو</a>
          </nav>

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        <a href="#" onClick={close}>درباره شرکت</a>
        <a href={sec('services')} onClick={close}>خدمات</a>
        <Link to="/blog" onClick={close}>وبلاگ</Link>
        <a href={sec('reviews')} onClick={close}>نظرات</a>
        <a href={sec('contact')} onClick={close}>تماس</a>
        <a href={sec('order')} onClick={close} style={{ color: 'var(--white)' }}>سفارش جستجوی خودرو</a>
      </div>
    </>
  );
}
