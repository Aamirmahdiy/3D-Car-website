import { Link, useParams } from 'react-router-dom';
import { posts } from '../data/blogPosts';
import '../styles/blog.css';

export default function BlogArticle() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <main className="blog">
        <div className="section-inner blog-notfound">
          <h1 className="blog-title">مطلب پیدا نشد</h1>
          <p className="blog-lead">متأسفانه این مقاله وجود ندارد یا حذف شده است.</p>
          <Link to="/blog" className="btn-primary blog-back-btn">بازگشت به وبلاگ</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="blog">
      <article className="section-inner blog-article-inner">
        <Link to="/blog" className="blog-back">→ بازگشت به وبلاگ</Link>

        <span className="section-label">{post.category}</span>
        <h1 className="blog-article-title">{post.title}</h1>
        <div className="blog-article-meta">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        <div className="blog-article-cover" style={{ background: post.cover }} />

        <div className="blog-article-body">
          {post.content.map((block, i) =>
            block.h ? <h2 key={i}>{block.h}</h2> : <p key={i}>{block.p}</p>
          )}
        </div>

        <div className="blog-article-cta">
          <p>به دنبال خودروی مورد نظر خود هستید؟</p>
          <a href="/#services" className="btn-primary">مشاهده خدمات ما</a>
        </div>
      </article>
    </main>
  );
}
