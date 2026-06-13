import { useRef, useEffect } from 'react';
import '../styles/proofTicker.css';

const StarIcon  = () => <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const ShieldIcon= () => <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>;
const TruckIcon = () => <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>;

const ITEMS = [
  { icon: <StarIcon />,   text: 'امتیاز ۴٫۶ در گوگل' },
  { icon: <CheckIcon />,  text: 'بیش از ۴٬۰۰۰ مشتری راضی' },
  { icon: <ShieldIcon />, text: '۱۰۰٪ بررسی کارکرد' },
  { icon: <TruckIcon />,  text: 'تحویل درب منزل شما' },
];

export default function ProofTicker() {
  const barRef   = useRef();
  const trackRef = useRef();
  const doubled  = [...ITEMS, ...ITEMS];

  useEffect(() => {
    const bar   = barRef.current;
    const track = trackRef.current;
    if (!bar || !track) return;
    const io = new IntersectionObserver(
      ([entry]) => { track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'; },
      { rootMargin: '0px' }
    );
    io.observe(bar);
    return () => io.disconnect();
  }, []);

  return (
    <div className="proof-bar" ref={barRef}>
      <div className="proof-track" ref={trackRef}>
        {doubled.map((item, i) => (
          <span className="proof-item" key={i}>
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
