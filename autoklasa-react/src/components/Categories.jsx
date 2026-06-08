import '../styles/categories.css';

const CARDS = [
  { title: 'Cars', sub: 'from Europe' },
  { title: 'Cars', sub: 'from China' },
];

export default function Categories() {
  return (
    <section className="categories">
      <div className="section-inner">
        <div className="cat-grid">
          {CARDS.map((c) => (
            <div className="cat-card" key={c.sub}>
              <div className="cat-body">
                <div className="cat-title">{c.title}</div>
                <div className="cat-sub">{c.sub}</div>
              </div>
              <div className="cat-actions">
                <a href="#" className="cat-btn cat-btn--outline">See the offer</a>
                <a href="#" className="cat-btn cat-btn--gold">Ask for a quote</a>
                <a href="#" className="cat-btn cat-btn--dark">Search for a car</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
