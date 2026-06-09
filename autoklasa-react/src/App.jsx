import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CarScene from './components/CarScene';
import StatsBar from './components/StatsBar';
import ProofTicker from './components/ProofTicker';
import Categories from './components/Categories';
import Benefits from './components/Benefits';
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
      <div style={{ background: '#000', height: '30vh' }} />
      <div style={{ background: '#000', overflow: 'hidden' }}>
        <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>
          <ProofTicker />
        </div>
      </div>
      <div style={{ background: '#000', overflow: 'hidden' }}>
        <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>
          <Benefits />
        </div>
      </div>
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
