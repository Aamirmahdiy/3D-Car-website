import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CarScene from './components/CarScene';
import StatsBar from './components/StatsBar';
import Categories from './components/Categories';
import Reviews from './components/Reviews';
import Faq from './components/Faq';
import CtaBanner from './components/CtaBanner';
import Contact from './components/Contact';
import Footer from './components/Footer';
import DeferUntilNear from './components/DeferUntilNear';

// CarScene (the hero sweep-in) stays eager so the car is the first thing to
// load. The two below-the-fold 3D scenes load only as they near the viewport,
// so their WebGL context + Porsche download never compete with the hero.
const WhySection = lazy(() => import('./components/WhySection'));
const ReviewsCarScene = lazy(() => import('./components/ReviewsCarScene'));

export default function App() {
  return (
    <>
      <Header />
      <Hero />
      <CarScene />
      <StatsBar />
      <Categories />
      <DeferUntilNear placeholderClassName="defer-why">
        <Suspense fallback={<div className="defer-why" />}>
          <WhySection />
        </Suspense>
      </DeferUntilNear>
      {/* Black gap that hosts WhySection's overflowing features (the امنیت/Security
          card floats down to bottom: -520px). Sized just tall enough to clear it,
          so the third car (ReviewsCarScene) sits right below — tune this height to
          move the third car closer/further. */}
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
      <Footer />
    </>
  );
}
