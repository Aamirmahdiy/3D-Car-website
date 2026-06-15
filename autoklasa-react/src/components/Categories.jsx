import '../styles/categories.css';

const CARDS = [
  { title: 'خودرو', sub: 'از اروپا' },
  { title: 'خودرو', sub: 'از چین' },
];

export default function Categories() {
  return (
    <section className="categories" id="services">
      <div className="section-inner">
        <div className="cat-grid">
          {CARDS.map((c) => (
            <div className="cat-card" key={c.sub}>
              <div className="cat-body">
                <div className="cat-title">{c.title}</div>
                <div className="cat-sub">{c.sub}</div>
              </div>
              <div className="cat-actions">
                <a href="#" className="cat-btn cat-btn--outline">مشاهده خدمات</a>
                <a href="#" className="cat-btn cat-btn--gold">مشاهده خودرو ها</a>
                <a href="#" className="cat-btn cat-btn--dark">جستجوی خودرو</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
