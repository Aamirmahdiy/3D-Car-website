import { useEffect, useRef, useState } from 'react';

/* Renders a reserved-height placeholder until it scrolls within `rootMargin`
   of the viewport, then mounts `children` (and disconnects). Used to keep the
   heavy below-the-fold 3D scenes — their WebGL context, HDR environment, and
   multi-MB model download — out of the hero car's critical load window. */
export default function DeferUntilNear({ children, placeholderClassName, rootMargin = '150% 0px' }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  if (show) return children;
  return <div ref={ref} className={placeholderClassName} aria-hidden="true" />;
}
