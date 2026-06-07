import '../styles/categories.css';

const CarIcon  = () => <svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/></svg>;
const ArrowIcon= () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>;

export default function Categories() {
  return (
    <section className="categories">
      <div className="section-inner">
        <div className="section-label">Our offer</div>
        <h2 className="section-title">Choose your direction</h2>
        <p className="section-desc">We import cars from across Europe and China. Every vehicle is individually selected and verified.</p>

        <div className="cat-grid">
          <div className="cat-card cat-eu">
            <div className="cat-flag">🇪🇺</div>
            <div className="cat-bg-icon"><CarIcon /></div>
            <div className="cat-body">
              <div className="cat-label">Premium offer</div>
              <div className="cat-title">Cars from<br />Europe</div>
              <div className="cat-desc">Verified vehicles from Germany, Netherlands, Belgium and other EU countries. Authorised service records, full service history.</div>
              <div className="cat-features">
                {['BMW', 'Mercedes', 'Audi', 'Volkswagen'].map(b => (
                  <span className="cat-feature" key={b}>{b}</span>
                ))}
              </div>
              <a href="#" className="btn-white">See the offer <ArrowIcon /></a>
            </div>
          </div>

          <div className="cat-card cat-cn">
            <div className="cat-flag">🇨🇳</div>
            <div className="cat-bg-icon"><CarIcon /></div>
            <div className="cat-body">
              <div className="cat-label">New era of motoring</div>
              <div className="cat-title">Cars from<br />China</div>
              <div className="cat-desc">Modern EVs and hybrids with the latest technology. BYD, NIO, Zeekr — the brands of the future within your reach.</div>
              <div className="cat-features">
                {['BYD', 'NIO', 'Zeekr', 'Chery'].map(b => (
                  <span className="cat-feature" key={b}>{b}</span>
                ))}
              </div>
              <a href="#" className="btn-white">See the offer <ArrowIcon /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
