import '../styles/statsBar.css';

const STATS = [
  { number: '4000', suffix: '+', desc: 'satisfied customers' },
  { number: '4.', suffix: '6',  desc: 'Google rating' },
  { number: '10',  suffix: '+', desc: 'years of experience' },
  { number: '15',  suffix: '+', desc: 'import countries' },
  { number: '100', suffix: '%', desc: 'mileage verification' },
];

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-bar-inner">
        {STATS.map((s) => (
          <div className="stat-item" key={s.desc}>
            <div className="stat-number">{s.number}<span>{s.suffix}</span></div>
            <div className="stat-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
