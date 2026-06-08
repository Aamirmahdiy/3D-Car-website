import Header from './components/Header';
import Hero from './components/Hero';
import CarScene from './components/CarScene';
import StatsBar from './components/StatsBar';
import ProofTicker from './components/ProofTicker';
import Categories from './components/Categories';
import WhySection from './components/WhySection';
import Benefits from './components/Benefits';
import Reviews from './components/Reviews';
import Faq from './components/Faq';
import CtaBanner from './components/CtaBanner';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <Hero />
      <CarScene />
      <StatsBar />
      <Categories />
      <WhySection />
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
      <Reviews />
      <Faq />
      <CtaBanner />
      <Contact />
      <Footer />
    </>
  );
}
