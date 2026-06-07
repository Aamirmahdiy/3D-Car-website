import { useState } from 'react';
import '../styles/faq.css';

const FAQ_DATA = [
  { q: 'How does the car buying process work at Autoklasa?', a: 'It\'s simple: fill in a form with your requirements, our consultant contacts you, we search for the right car, verify it, and deliver it to your specified address.' },
  { q: 'How long does it take to import a car?', a: 'The lead time depends on model availability. Typically it takes 2–6 weeks. Cars from Europe arrive faster, while cars from China usually take 4–8 weeks.' },
  { q: 'Which countries do you import cars from?', a: 'We primarily import from Germany, Netherlands, Belgium, France, Italy, Austria, and Switzerland. For Chinese vehicles we work directly with authorised distributors in China.' },
  { q: 'Can I finance the purchase of a car?', a: 'Yes — we offer financing through leasing or a car loan. We work with leading financial institutions and will help you choose the best option for your situation.' },
  { q: 'How do you verify the mileage?', a: 'We check authorised service documents, European vehicle history databases (CarVertical, Carfax), and physically inspect the car before purchase.' },
  { q: 'Is the car covered by a warranty?', a: 'Imported cars may still have an active manufacturer\'s warranty. We inform you about this with every offer. We also offer the option to purchase an additional mechanical warranty.' },
  { q: 'Are there any additional customs fees?', a: 'Cars imported from EU countries are duty-free. For vehicles from China, import duty applies and is included in the final quote. We always provide a transparent all-in price.' },
  { q: 'Can I see the car before buying?', a: 'Yes — we organise live video presentations of the car. We can also arrange your visit to the seller. Once the car arrives in Poland, you can inspect it before finalising the transaction.' },
  { q: 'What if the car doesn\'t meet my expectations?', a: 'We establish your exact requirements before every transaction. If the delivered vehicle significantly differs from the description, we resolve the matter individually and protect your interests.' },
  { q: 'What documents will I receive?', a: 'You receive a complete set: purchase invoice, original vehicle documents, mileage verification report, customs documents (if applicable), and all documents needed for registration.' },
  { q: 'Can I specify exact equipment?', a: 'Absolutely! The more detailed your requirements (colour, engine, equipment, year), the better we can match the offer. We can search for a specific car for months if needed.' },
  { q: 'What are the total import costs?', a: 'The total cost covers the car price, transport, transit insurance, customs fees (if applicable), homologation, and our commission. We always provide a clear, all-inclusive quote before we start.' },
];

const PlusIcon = () => <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex(i === openIndex ? null : i);

  return (
    <section className="faq">
      <div className="section-inner">
        <div className="faq-header">
          <div className="section-label" style={{ justifyContent: 'center' }}>Have questions?</div>
          <h2 className="section-title">Frequently asked<br />questions</h2>
        </div>

        <div className="faq-grid">
          {FAQ_DATA.map((item, i) => (
            <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={i}>
              <button className="faq-question" onClick={() => toggle(i)}>
                <span className="faq-question-text">{item.q}</span>
                <div className="faq-toggle"><PlusIcon /></div>
              </button>
              {openIndex === i && (
                <div className="faq-answer">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
