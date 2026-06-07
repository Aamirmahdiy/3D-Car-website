import '../styles/hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Buy a Car. <em>Online.</em></h1>

        <p>With us, you'll save time and stress. Don't search for a car on your own, leave it in the hands of the experts.</p>

        <div className="hero-checks">
          <span>We are looking for</span>
          <span>We verify</span>
          <span>We deliver</span>
        </div>

        <div className="hero-actions">
          <a href="#" className="btn-hero-outline">See the offer</a>
          <a href="#" className="btn-hero-gold">Ask for a quote</a>
        </div>
      </div>
    </section>
  );
}
