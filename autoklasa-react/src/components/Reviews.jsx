import '../styles/reviews.css';

const GoogleG = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const REVIEWS = [
  { initial: 'S', avatarClass: 'avatar-1', name: 'Sławomir S.', date: '2 months ago',  text: 'Professional service at the highest level. Help choosing the car, history verification, home delivery. I recommend to anyone looking for a reliable importer.' },
  { initial: 'M', avatarClass: 'avatar-2', name: 'Mateusz M.',  date: '3 months ago', text: 'They found exactly the car I asked for. The whole process was quick and problem-free. The car arrived on time with no surprises whatsoever. Highly recommend!' },
  { initial: 'J', avatarClass: 'avatar-3', name: 'Jakub A.',     date: '4 months ago', text: 'Great company, I recommend wholeheartedly. Always fast communication and expert advice. You can tell they genuinely care about the customer, not just the profit.' },
  { initial: 'A', avatarClass: 'avatar-4', name: 'Agnieszka S.', date: '5 months ago', text: 'Amazing service! I never thought buying a car abroad could be this simple. Autoklasa handled everything from A to Z. My new Mercedes is absolutely perfect!' },
];

export default function Reviews() {
  return (
    <section className="reviews">
      <div className="section-inner">
        <div className="reviews-header">
          <div>
            <div className="section-label">Customer reviews</div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>What do our customers say?</h2>
          </div>
          <div className="google-badge">
            <GoogleG size={26} />
            <div>
              <div className="badge-rating">4.6</div>
              <div className="badge-stars">★★★★★</div>
              <div className="badge-count">Google rating</div>
            </div>
          </div>
        </div>

        <div className="reviews-grid">
          {REVIEWS.map((r) => (
            <div className="review-card" key={r.name}>
              <div className="review-top">
                <div className="reviewer">
                  <div className={`reviewer-avatar ${r.avatarClass}`}>{r.initial}</div>
                  <div>
                    <div className="reviewer-name">{r.name}</div>
                    <div className="reviewer-date">{r.date}</div>
                  </div>
                </div>
                <div className="review-stars">★★★★★</div>
              </div>
              <p className="review-text">{r.text}</p>
              <div className="review-source">
                <GoogleG size={14} />
                Review from Google
              </div>
            </div>
          ))}
        </div>

        <div className="reviews-more">
          <a href="#">
            See all reviews (+178)
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
