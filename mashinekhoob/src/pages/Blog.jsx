import { Link } from 'react-router-dom';
import { posts } from '../data/blogPosts';
import '../styles/blog.css';

export default function Blog() {
  return (
    <main className="blog">
      <div className="section-inner">
        <header className="blog-head">
          <span className="section-label">وبلاگ ماشین خوب</span>
          <h1 className="blog-title">مقالات و راهنمای خرید خودرو</h1>
          <p className="blog-lead">
            جدیدترین مطالب درباره واردات، انتخاب، بازرسی و نگهداری خودرو را اینجا بخوانید.
          </p>
        </header>

        <div className="blog-grid">
          {posts.map((p) => (
            <article className="blog-card" key={p.slug}>
              <Link to={`/blog/${p.slug}`} className="blog-card-link">
                <div className="blog-card-media" style={{ background: p.cover }}>
                  <span className="blog-card-cat">{p.category}</span>
                </div>
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{p.title}</h2>
                  <p className="blog-card-excerpt">{p.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{p.date}</span>
                    <span>{p.readTime}</span>
                  </div>
                  <span className="blog-card-more">ادامه مطلب ←</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
