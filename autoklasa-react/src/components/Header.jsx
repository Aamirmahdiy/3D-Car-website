import { useState } from 'react';
import '../styles/header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header>
        <div className="nav-inner">
          <nav>
            <a href="#">About the company</a>
            <a href="#">Offer</a>
            <a href="#">Blog</a>
            <a href="#">Opinions</a>
            <a href="#">Contact</a>
            <a href="#" className="btn-nav">Order a car search</a>
          </nav>

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        <a href="#" onClick={() => setMenuOpen(false)}>About the company</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Offer</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Blog</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Opinions</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Contact</a>
        <a href="#" onClick={() => setMenuOpen(false)} style={{ color: 'var(--white)' }}>Order a car search</a>
      </div>
    </>
  );
}
