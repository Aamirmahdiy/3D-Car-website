import { lazy, Suspense, useEffect } from 'react';
import Hero from '../components/Hero';
import CarScene from '../components/CarScene';
import StatsBar from '../components/StatsBar';
import Categories from '../components/Categories';
import Reviews from '../components/Reviews';
import Faq from '../components/Faq';
import CtaBanner from '../components/CtaBanner';
import Contact from '../components/Contact';
import DeferUntilNear from '../components/DeferUntilNear';

// CarScene (the hero sweep-in) stays eager so the car is the first thing to
// load. The two below-the-fold 3D scenes load only as they near the viewport,
// so their WebGL context + Porsche download never compete with the hero.
const WhySection = lazy(() => import('../components/WhySection'));
const ReviewsCarScene = lazy(() => import('../components/ReviewsCarScene'));

export default function Home() {
  // When arriving from another route with a hash (e.g. /#services), scroll to that
  // section once the eager sections have laid out — the browser's own attempt fires
  // before React renders the content, so it misses.
  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return;
    let r1, r2, to;
    const go = () => {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView();
    };
    r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(go); });
    to = setTimeout(go, 300);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(to); };
  }, []);

  return (
    <>
      <Hero />
      <CarScene />
      <StatsBar />
      <Categories />
      <DeferUntilNear placeholderClassName="defer-why">
        <Suspense fallback={<div className="defer-why" />}>
          <WhySection />
        </Suspense>
      </DeferUntilNear>
      {/* Black gap that hosts WhySection's overflowing features. */}
      <div style={{ background: '#000', height: '540px' }} />
      <DeferUntilNear placeholderClassName="defer-reviews">
        <Suspense fallback={<div className="defer-reviews" />}>
          <ReviewsCarScene />
        </Suspense>
      </DeferUntilNear>
      <Reviews />
      <Faq />
      <CtaBanner />
      <Contact />
    </>
  );
}
