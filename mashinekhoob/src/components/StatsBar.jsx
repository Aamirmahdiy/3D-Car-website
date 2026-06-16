import '../styles/statsBar.css';

const STATS = [
  { number: '۴۰', suffix: '+', desc: 'مشتری راضی', gold: true },
  { number: '۴٫', suffix: '۶',  desc: 'امتیاز گوگل' },
  { number: '۱۰',  suffix: '+', desc: 'سال تجربه' },
  { number: '۵',  suffix: '+', desc: 'کشور واردات' },
  { number: '۱۰۰', suffix: '٪', desc: 'بررسی کارکرد' },
];

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-bar-inner">
        <div className="stats-items">
          {STATS.map((s) => (
            <div className="stat-item" key={s.desc}>
              <div className={`stat-number${s.gold ? ' stat-number--gold' : ''}`}>
                {s.number}<span>{s.suffix}</span>
              </div>
              <div className="stat-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        <a href="#reviews" className="btn-reviews">
          خواندن نظرات
        </a>
      </div>
    </div>
  );
}
